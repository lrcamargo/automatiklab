import { hasPneumaticPilot } from "./catalog";
import { portKey, type Circuit, type RuntimeState, type SolveResult } from "./types";

type Adjacency = Map<string, string[]>;

interface NetworkState {
  pressurized: Set<string>;
  vented: Set<string>;
  conflicts: Set<string>;
}

const isMainValve = (type: Circuit["components"][number]["type"]) =>
  type === "valve32" || type === "valve52" || type === "valve42" || type === "valve53";

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
  previous?: NetworkState,
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

      case "sensor": {
        const active = sensorActive(comp, runtime);
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

      /*
       * 4/2: quatro vias, duas posições, escape único em 3. Acionada liga
       * 1→4 e 2→3; em repouso liga 1→2 e 4→3.
       */
      case "valve42":
        exhausts.add(key("R"));
        if (actuated[comp.id]) {
          link(adjacency, key("P"), key("B"));
          link(adjacency, key("A"), key("R"));
        } else {
          link(adjacency, key("P"), key("A"));
          link(adjacency, key("B"), key("R"));
        }
        break;

      /*
       * 5/3 centro fechado: a posição central bloqueia todas as vias, o que
       * prende o cilindro na parada intermediária. Só sai do centro com
       * piloto ativo em 14 ou 12.
       */
      case "valve53": {
        exhausts.add(key("R1"));
        exhausts.add(key("R2"));
        const left = previous?.pressurized.has(key("14")) ?? false;
        const right = previous?.pressurized.has(key("12")) ?? false;
        const manual = !!runtime.signals[comp.id];
        if ((left || manual) && !right) {
          link(adjacency, key("P"), key("B"));
          link(adjacency, key("A"), key("R1"));
        } else if (right && !left && !manual) {
          link(adjacency, key("P"), key("A"));
          link(adjacency, key("B"), key("R2"));
        }
        // centro fechado: nenhuma ligação — todas as vias bloqueadas
        break;
      }

      /*
       * Contador: emite sinal em 2 quando a contagem atinge o pré-ajuste.
       * A contagem em si avança em stepCounters, fora do grafo.
       */
      case "counter":
        if ((runtime.counts?.[comp.id] ?? 0) >= (comp.preset ?? 1)) {
          link(adjacency, key("P"), key("A"));
        }
        break;

      // unidade de conservação: passagem direta, condiciona sem bloquear
      case "lubrifil":
      case "conservationUnit":
        link(adjacency, key("P"), key("A"));
        break;

      // escape: sempre atmosfera
      case "exhaust":
        exhausts.add(key("R"));
        break;

      /*
       * Alternadora (OU): a esfera fecha o lado sem pressão, então a saída 2
       * acompanha a entrada pressurizada. Sem nenhuma pressão a saída fica
       * ligada às duas entradas, para poder despressurizar.
       */
      case "valveOr": {
        // primeira passada: elemento isolado, só para descobrir as entradas
        if (!previous) break;
        const p1 = previous.pressurized.has(key("P1"));
        const p2 = previous.pressurized.has(key("P2"));
        if (p1) link(adjacency, key("P1"), key("A"));
        if (p2) link(adjacency, key("P2"), key("A"));
        if (!p1 && !p2) {
          link(adjacency, key("P1"), key("A"));
          link(adjacency, key("P2"), key("A"));
        }
        break;
      }

      /*
       * Simultaneidade (E): só há saída com as duas entradas pressurizadas, e
       * passa a de menor pressão. Com uma só entrada ativa a válvula
       * autobloqueia; sem nenhuma, a saída drena pelas entradas.
       */
      case "valveAnd": {
        if (!previous) break;
        const p1 = previous.pressurized.has(key("P1"));
        const p2 = previous.pressurized.has(key("P2"));
        // passa só com as duas entradas ativas; sem nenhuma, drena pelas entradas
        if ((p1 && p2) || (!p1 && !p2)) {
          link(adjacency, key("P1"), key("A"));
          link(adjacency, key("P2"), key("A"));
        }
        break;
      }

      /*
       * Temporizadora 3/2: comporta-se como uma 3/2 NF cujo piloto 12 só
       * comuta depois do retardo. A contagem fica no runtime.
       */
      case "valveTimer":
        exhausts.add(key("R"));
        if (runtime.timers?.[comp.id]) link(adjacency, key("P"), key("A"));
        else link(adjacency, key("A"), key("R"));
        break;

      // retenção e reguladoras: passagem direta no modelo booleano
      case "checkValve":
      case "throttle":
      case "throttleOneWay":
        link(adjacency, key("P"), key("A"));
        break;

      /*
       * Escape rápido: com pressão em 1 alimenta 2; sem pressão em 1 a via 2
       * descarrega direto pela atmosfera em 3, sem voltar pela linha.
       */
      case "quickExhaust": {
        exhausts.add(key("R"));
        if (!previous) break;
        if (previous.pressurized.has(key("P"))) link(adjacency, key("P"), key("A"));
        else link(adjacency, key("A"), key("R"));
        break;
      }

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
    // Numeração normativa na representação: 12 à esquerda (acionamento)
    // e 14 à direita (retorno). Cada sinal comuta para o quadro oposto.
    const pilot12 =
      hasPneumaticPilot(comp.actuation) && network.pressurized.has(portKey(comp.id, "12"));
    const pilot14 =
      hasPneumaticPilot(comp.returnType) && network.pressurized.has(portKey(comp.id, "14"));

    const dualPilot = hasPneumaticPilot(comp.actuation) && hasPneumaticPilot(comp.returnType);

    if (dualPilot) {
      // Na 5/2 de memória: 12 seleciona 1→2 (posição false, avanço) e
      // 14 seleciona 1→4 (posição true, recuo).
      if (pilot12 && !pilot14) next[comp.id] = false;
      else if (pilot14 && !pilot12) next[comp.id] = true;
      else next[comp.id] = last;
    } else if ((manualOverride || pilot12) && !pilot14) {
      // Em válvula monoestável, o acionamento à esquerda vence a mola.
      next[comp.id] = true;
    } else if (pilot14 && !manualOverride && !pilot12) {
      next[comp.id] = false;
    } else if ((manualOverride || pilot12) && pilot14) {
      next[comp.id] = last;
    } else if (comp.returnType === "mola" || comp.returnType === "centragemMolas") {
      next[comp.id] = false;
    } else if (comp.actuation === "mola" || comp.actuation === "centragemMolas") {
      next[comp.id] = true;
    } else if (hasPneumaticPilot(comp.actuation) || hasPneumaticPilot(comp.returnType)) {
      next[comp.id] = last;
    } else {
      // Acionamentos diretos continuam disponíveis para interação na bancada.
      next[comp.id] = manualOverride;
    }
  }

  return next;
}

const sameNetwork = (a: NetworkState, b: NetworkState) =>
  a.pressurized.size === b.pressurized.size &&
  [...a.pressurized].every((node) => b.pressurized.has(node));

/**
 * Elementos OU, E e escape rápido mudam de caminho conforme a pressão que eles
 * mesmos ajudam a produzir. Reaplica o grafo até estabilizar.
 */
function settleNetwork(
  circuit: Circuit,
  runtime: RuntimeState,
  actuated: Record<string, boolean>,
): NetworkState {
  let network = solveNetwork(circuit, runtime, actuated);
  for (let index = 0; index < 6; index += 1) {
    const next = solveNetwork(circuit, runtime, actuated, network);
    if (sameNetwork(network, next)) return next;
    network = next;
  }
  return network;
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

  let network = settleNetwork(circuit, runtime, actuated);
  const maxIterations = Math.max(4, circuit.components.length * 2);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next = nextValvePositions(circuit, runtime, network, actuated);
    if (samePositions(actuated, next)) break;
    actuated = next;
    network = settleNetwork(circuit, runtime, actuated);
  }

  return { ...network, actuated };
}

/**
 * Avança a contagem das válvulas temporizadoras. O retardo só corre enquanto
 * houver sinal na porta 12; ao perder o sinal a contagem zera e a válvula
 * volta imediatamente à posição de repouso.
 */
export function stepTimers(
  circuit: Circuit,
  runtime: RuntimeState,
  solved: SolveResult,
  deltaSeconds: number,
): { timers: Record<string, boolean>; timerElapsed: Record<string, number> } {
  const timers: Record<string, boolean> = {};
  const timerElapsed: Record<string, number> = {};

  for (const comp of circuit.components) {
    if (comp.type !== "valveTimer") continue;
    const signal = solved.pressurized.has(portKey(comp.id, "Z"));
    if (!signal) {
      timers[comp.id] = false;
      timerElapsed[comp.id] = 0;
      continue;
    }
    const elapsed = (runtime.timerElapsed?.[comp.id] ?? 0) + deltaSeconds;
    timerElapsed[comp.id] = elapsed;
    timers[comp.id] = elapsed >= (comp.delay ?? 2);
  }

  return { timers, timerElapsed };
}

/**
 * Avança os contadores pneumáticos. A contagem sobe na borda de subida do
 * sinal em Z; um sinal em Y zera imediatamente.
 */
export function stepCounters(
  circuit: Circuit,
  runtime: RuntimeState,
  solved: SolveResult,
): { counts: Record<string, number>; countEdges: Record<string, boolean> } {
  const counts: Record<string, number> = { ...runtime.counts };
  const countEdges: Record<string, boolean> = {};

  for (const comp of circuit.components) {
    if (comp.type !== "counter") continue;
    const pulse = solved.pressurized.has(portKey(comp.id, "Z"));
    const reset = solved.pressurized.has(portKey(comp.id, "Y"));
    const previousPulse = runtime.countEdges?.[comp.id] ?? false;

    if (reset) counts[comp.id] = 0;
    else if (pulse && !previousPulse) {
      counts[comp.id] = Math.min(99999, (counts[comp.id] ?? 0) + 1);
    } else counts[comp.id] = counts[comp.id] ?? 0;

    countEdges[comp.id] = pulse;
  }

  return { counts, countEdges };
}

/** avança a posição dos cilindros com base nas pressões calculadas */
export function stepStrokes(
  circuit: Circuit,
  runtime: RuntimeState,
  solved: SolveResult,
  deltaSeconds: number,
): Record<string, number> {
  const next: Record<string, number> = { ...runtime.strokes };

  // reguladoras ligadas ao cilindro limitam a velocidade do curso
  const restrictionFor = (componentId: string) => {
    let factor = 1;
    for (const tube of circuit.tubes) {
      const ends = [tube.from, tube.to];
      if (!ends.some((end) => end.componentId === componentId)) continue;
      const other = ends.find((end) => end.componentId !== componentId);
      const regulator = circuit.components.find((item) => item.id === other?.componentId);
      if (regulator?.type === "throttle" || regulator?.type === "throttleOneWay") {
        factor = Math.min(factor, regulator.restriction ?? 1);
      }
    }
    return factor;
  };

  for (const comp of circuit.components) {
    if (
      comp.type !== "cylinderSingle" &&
      comp.type !== "cylinderDouble" &&
      comp.type !== "rotaryMotor" &&
      comp.type !== "rotaryOscillator" &&
      comp.type !== "rotaryCylinder"
    )
      continue;
    const current = next[comp.id] ?? 0;
    const speed = (comp.speed ?? 1) * restrictionFor(comp.id) * deltaSeconds;
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
  if (
    comp.type === "rotaryMotor" ||
    comp.type === "rotaryOscillator" ||
    comp.type === "rotaryCylinder"
  ) {
    const a = solved.pressurized.has(portKey(comp.id, "A"));
    const b = solved.pressurized.has(portKey(comp.id, "B"));
    if (a && !b) return 1;
    if (b && !a) return -1;
    return 0;
  }
  if (comp.type !== "cylinderSingle" && comp.type !== "cylinderDouble") return 0;
  const a = solved.pressurized.has(portKey(comp.id, "A"));
  const b = comp.type === "cylinderDouble" && solved.pressurized.has(portKey(comp.id, "B"));
  if (comp.type === "cylinderSingle") {
    /*
     * Com avanço por mola (entrada dianteira) a lógica se inverte: a mola
     * mantém a haste avançada e o ar comprimido é quem a recua. O repouso
     * desse cilindro é avançado, não recuado.
     */
    if (comp.springAction === "avancoMola") return a ? -1 : 1;
    return a ? 1 : -1;
  }
  if (a && !b) return 1;
  if (b && !a) return -1;
  return 0;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));