import { CATALOG } from "./catalog";
import { portKey, type Circuit, type RuntimeState, type SolveResult } from "./types";

/**
 * Resolve o estado pneumático do circuito.
 *
 * Modelo intencionalmente simplificado (adequado a fins didáticos):
 * a pressão se propaga por condutividade a partir das fontes, atravessando
 * tubos e os caminhos internos das válvulas conforme sua posição atual.
 */
export function solveCircuit(circuit: Circuit, runtime: RuntimeState): SolveResult {
  const actuated: Record<string, boolean> = {};

  for (const comp of circuit.components) {
    if (comp.type !== "valve32" && comp.type !== "valve52") continue;
    // acionamento manual direto no símbolo da válvula (clique na bancada)
    const manual = !!runtime.signals[comp.id];
    const actuator = circuit.components.find((c) => c.id === comp.actuatorId);
    let fromActuator = false;
    if (actuator?.type === "button") {
      fromActuator = !!runtime.signals[actuator.id];
    } else if (actuator?.type === "sensor") {
      const stroke = runtime.strokes[actuator.targetId ?? ""] ?? 0;
      fromActuator = actuator.trigger === "retracted" ? stroke <= 0.02 : stroke >= 0.98;
    }
    // o clique manual comuta a posição em relação ao acionamento do circuito
    actuated[comp.id] = manual !== fromActuator;
  }


  // grafo de portas (arestas externas = mangueiras, internas = caminhos da válvula)
  type Edge = { to: string; external: boolean };
  const adjacency = new Map<string, Edge[]>();
  const link = (a: string, b: string, external = false) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push({ to: b, external });
    adjacency.get(b)!.push({ to: a, external });
  };

  /** válvulas só aceitam alimentação externa pela porta 1 (P) */
  const valvePorts = new Map<string, string>(); // portKey -> portId, apenas válvulas
  for (const comp of circuit.components) {
    if (comp.type !== "valve32" && comp.type !== "valve52") continue;
    for (const port of CATALOG[comp.type].ports) {
      valvePorts.set(portKey(comp.id, port.id), port.id);
    }
  }
  const acceptsSupply = (node: string) => {
    const portId = valvePorts.get(node);
    return portId === undefined || portId === "P";
  };

  for (const tube of circuit.tubes) {
    link(
      portKey(tube.from.componentId, tube.from.portId),
      portKey(tube.to.componentId, tube.to.portId),
      true,
    );
  }


  const sources: string[] = [];
  const vented = new Set<string>();

  for (const comp of circuit.components) {
    const k = (port: string) => portKey(comp.id, port);
    switch (comp.type) {
      case "source":
        sources.push(k("P"));
        break;
      case "valve32":
        if (actuated[comp.id]) {
          link(k("P"), k("A"));
          vented.add(k("R"));
        } else {
          link(k("A"), k("R"));
          vented.add(k("A"));
          vented.add(k("R"));
        }
        break;
      case "valve52":
        if (actuated[comp.id]) {
          // posição acionada normalizada: 1 → 4 e 2 → 3
          link(k("P"), k("B"));
          link(k("A"), k("R1"));
          vented.add(k("A"));
          vented.add(k("R1"));
          vented.add(k("R2"));
        } else {
          // posição de repouso normalizada: 1 → 2 e 4 → 5
          link(k("P"), k("A"));
          link(k("B"), k("R2"));
          vented.add(k("B"));
          vented.add(k("R1"));
          vented.add(k("R2"));
        }
        break;
      default:
        break;
    }
  }

  const pressurized = new Set<string>();
  const queue = [...sources];
  while (queue.length) {
    const node = queue.shift()!;
    if (pressurized.has(node)) continue;
    pressurized.add(node);
    for (const edge of adjacency.get(node) ?? []) {
      // uma mangueira só entrega pressão a uma válvula pela porta 1 (P);
      // ligar a fonte em 2, 3, 4 ou 5 não gera pressão útil no circuito
      if (edge.external && !acceptsSupply(edge.to)) continue;
      if (!pressurized.has(edge.to)) queue.push(edge.to);
    }
  }

  // portas ligadas ao escape não retêm pressão
  const ventedQueue = [...vented];
  const ventedAll = new Set<string>();
  while (ventedQueue.length) {
    const node = ventedQueue.shift()!;
    if (ventedAll.has(node)) continue;
    ventedAll.add(node);
    for (const edge of adjacency.get(node) ?? []) {
      if (!ventedAll.has(edge.to) && !pressurized.has(edge.to)) ventedQueue.push(edge.to);
    }
  }


  return { pressurized, actuated };
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

export function portsOf(type: keyof typeof CATALOG) {
  return CATALOG[type].ports;
}
