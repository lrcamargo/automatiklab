import { hasPneumaticPilot } from "./catalog";
import { portKey, type Circuit, type RuntimeState, type SolveResult } from "./types";

type Adjacency = Map<string, string[]>;

interface NetworkState {
  pressurized: Set<string>;
  vented: Set<string>;
  conflicts: Set<string>;
}

const isMainValve = (type: Circuit["components"][number]["type"]) =>
  type === "valve32" || type === "valve52";

const link = (adjacency: Adjacency, a: string, b: string) => {
  if (!adjacency.has(a)) adjacency.set(a, []);
  if (!adjacency.has(b)) adjacency.set(b, []);
  adjacency.get(a)!.push(b);
  adjacency.get(b)!.push(a);
};

const walk = (adjacency: Adjacency, starts: Iterable<string>) => {
  const visited = new Set<string>();
  const queue = [...starts];
  let index = 0;

  while (index < queue.length) {
    const node = queue[index++];
    if (node === undefined || visited.has(node)) continue;
    visited.add(node);
    for (const neighbor of adjacency.get(node) ?? []) {
      if (!visited.has(neighbor)) queue.push(neighbor);
    }
  }

  return visited;
};

const sensorActive = (comp: Circuit["components"][number], runtime: RuntimeState) => {
  if (comp.type !== "sensor") return false;
  const stroke = runtime.strokes[comp.targetId ?? ""] ?? 0;
  return comp.trigger === "retracted" ? stroke <= 0.02 : stroke >= 0.98;
};

/**
 * Monta o grafo fluídico para uma posição definida das válvulas e resolve
 * alimentação, escape e conflitos. As linhas são ideais nesta etapa: não há
 * perda de carga nem cálculo de vazão.
 */
function solveNetwork(
  circuit: Circuit,
  runtime: RuntimeState,
  actuated: Record<string, boolean>,
): NetworkState {
  const adjacency: Adjacency = new Map();
  const sources = new Set<string>();
  const exhausts = new Set<string>();

  for (const tube of circuit.tubes) {
    link(
      adjacency,
      portKey(tube.from.componentId, tube.from.portId),
      portKey(tube.to.componentId, tube.to.portId),
    );
  }

  for (const comp of circuit.components) {
    const key = (port: string) => portKey(comp.id, port);

    switch (comp.type) {
      case "source":
        if ((comp.pressure ?? 6) > 0) sources.add(key("P"));
        break;

      case "button":
      case "sensor": {
        const active =
          comp.type === "button" ? !!runtime.signals[comp.id] : sensorActive(comp, runtime);
        exhausts.add(key("R"));
        if (active) link(adjacency, key("P"), key("A"));
        else link(adjacency, key("A"), key("R"));
        break;
      }

      case "valve32":
        exhausts.add(key("R"));
        if (actuated[comp.id]) link(adjacency, key("P"), key("A"));
        else link(adjacency, key("A"), key("R"));
        break;

      case "valve52":
        exhausts.add(key("R1"));
        exhausts.add(key("R2"));
        if (actuated[comp.id]) {
          // posição acionada: 1 → 4 e 2 → 3
          link(adjacency, key("P"), key("B"));
          link(adjacency, key("A"), key("R1"));
        } else {
          // posição de repouso: 1 → 2 e 4 → 5
          link(adjacency, key("P"), key("A"));
          link(adjacency, key("B"), key("R2"));
        }
        break;

      default:
        break;
    }
  }

  const supplied = walk(adjacency, sources);
  const vented = walk(adjacency, exhausts);
  const conflicts = new Set([...supplied].filter((node) => vented.has(node)));
  const pressurized = new Set([...supplied].filter((node) => !vented.has(node)));

  return { pressurized, vented, conflicts };
}

function nextValvePositions(
  circuit: Circuit,
  runtime: RuntimeState,
  network: NetworkState,
  previous: Record<string, boolean>,
) {
  const next: Record<string, boolean> = {};

  for (const comp of circuit.components) {
    if (!isMainValve(comp.type)) continue;

    const last = previous[comp.id] ?? runtime.valvePositions[comp.id] ?? false;
    const manualOverride = !!runtime.signals[comp.id];
    const pilot14 =
      hasPneumaticPilot(comp.actuation) && network.pressurized.has(portKey(comp.id, "14"));
    const pilot12 =
      hasPneumaticPilot(comp.returnType) && network.pressurized.has(portKey(comp.id, "12"));

    if ((manualOverride || pilot14) && !pilot12) {
      next[comp.id] = true;
    } else if (pilot12 && !manualOverride && !pilot14) {
      next[comp.id] = false;
    } else if ((manualOverride || pilot14) && pilot12) {
      // Dois comandos simultâneos não escolhem uma nova posição.
      next[comp.id] = last;
    } else if (comp.returnType === "mola" || comp.returnType === "centragemMolas") {
      next[comp.id] = false;
    } else if (comp.actuation === "mola" || comp.actuation === "centragemMolas") {
      next[comp.id] = true;
    } else if (hasPneumaticPilot(comp.actuation) || hasPneumaticPilot(comp.returnType)) {
      // Duplo piloto: conserva a última posição quando nenhum piloto está ativo.
      next[comp.id] = last;
    } else {
      // Acionamentos diretos continuam disponíveis para interação na bancada.
      next[comp.id] = manualOverride;
    }
  }

  return next;
}

const samePositions = (a: Record<string, boolean>, b: Record<string, boolean>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => !!a[key] === !!b[key]);
};

/**
 * Resolve o estado pneumático do circuito.
 *
 * O algoritmo itera entre a propagação de ar e a posição das válvulas para que
 * um sinal conectado à porta piloto 14/12 possa comutar outra válvula. O modelo
 * é topológico e determinístico; pressão e vazão quantitativas ficam para a
 * futura camada física.
 */
export function solveCircuit(circuit: Circuit, runtime: RuntimeState): SolveResult {
  let actuated: Record<string, boolean> = {};
  for (const comp of circuit.components) {
    if (isMainValve(comp.type)) {
      actuated[comp.id] = runtime.valvePositions[comp.id] ?? false;
    }
  }

  let network = solveNetwork(circuit, runtime, actuated);
  const maxIterations = Math.max(4, circuit.components.length * 2);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next = nextValvePositions(circuit, runtime, network, actuated);
    if (samePositions(actuated, next)) break;
    actuated = next;
    network = solveNetwork(circuit, runtime, actuated);
  }

  // Garante que o grafo devolvido corresponda à última posição calculada.
  network = solveNetwork(circuit, runtime, actuated);
  return { ...network, actuated };
}

/** avança a posição dos cilindros com base nas pressões calculadas */
export function stepStrokes(
  circuit: Circuit,
  runtime: RuntimeState,
  solved: SolveResult,
  deltaSeconds: number,
): Record<string, number> {
  const next: Record<string, number> = { ...runtime.strokes };

  for (const comp of circuit.components) {
    if (comp.type !== "cylinderSingle" && comp.type !== "cylinderDouble") continue;
    const current = next[comp.id] ?? 0;
    const speed = (comp.speed ?? 1) * deltaSeconds;
    const direction = strokeDirection(comp, solved);
    next[comp.id] = clamp(current + direction * speed, 0, 1);
  }

  return next;
}

/**
 * Direção admissível do cilindro conforme a pressão realmente disponível.
 * 1 = avanço, -1 = recuo, 0 = sem movimento válido.
 */
export function strokeDirection(
  comp: Circuit["components"][number],
  solved: SolveResult,
): -1 | 0 | 1 {
  if (comp.type !== "cylinderSingle" && comp.type !== "cylinderDouble") return 0;
  const a = solved.pressurized.has(portKey(comp.id, "A"));
  const b = comp.type === "cylinderDouble" && solved.pressurized.has(portKey(comp.id, "B"));
  if (comp.type === "cylinderSingle") return a ? 1 : -1;
  if (a && !b) return 1;
  if (b && !a) return -1;
  return 0;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
