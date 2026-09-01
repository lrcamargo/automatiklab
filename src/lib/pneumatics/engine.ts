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
    const actuator = circuit.components.find((c) => c.id === comp.actuatorId);
    if (!actuator) {
      actuated[comp.id] = false;
      continue;
    }
    if (actuator.type === "button") {
      actuated[comp.id] = !!runtime.signals[actuator.id];
    } else if (actuator.type === "sensor") {
      const stroke = runtime.strokes[actuator.targetId ?? ""] ?? 0;
      actuated[comp.id] =
        actuator.trigger === "retracted" ? stroke <= 0.02 : stroke >= 0.98;
    } else {
      actuated[comp.id] = false;
    }
  }

  // grafo de portas
  const adjacency = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push(b);
    adjacency.get(b)!.push(a);
  };

  for (const tube of circuit.tubes) {
    link(
      portKey(tube.from.componentId, tube.from.portId),
      portKey(tube.to.componentId, tube.to.portId),
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
        if (actuated[comp.id]) link(k("P"), k("A"));
        else vented.add(k("A"));
        break;
      case "valve52":
        if (actuated[comp.id]) {
          // posição acionada normalizada: 1 → 4 e 2 → 3
          link(k("P"), k("B"));
          vented.add(k("A"));
        } else {
          // posição de repouso normalizada: 1 → 2 e 4 → 5
          link(k("P"), k("A"));
          vented.add(k("B"));
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
    for (const next of adjacency.get(node) ?? []) {
      if (!pressurized.has(next)) queue.push(next);
    }
  }

  // portas ligadas ao escape não retêm pressão
  const ventedQueue = [...vented];
  const ventedAll = new Set<string>();
  while (ventedQueue.length) {
    const node = ventedQueue.shift()!;
    if (ventedAll.has(node)) continue;
    ventedAll.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (!ventedAll.has(next) && !pressurized.has(next)) ventedQueue.push(next);
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
    const a = solved.pressurized.has(portKey(comp.id, "A"));
    const b = comp.type === "cylinderDouble" && solved.pressurized.has(portKey(comp.id, "B"));

    let direction = 0;
    if (comp.type === "cylinderSingle") direction = a ? 1 : -1;
    else if (a && !b) direction = 1;
    else if (b && !a) direction = -1;

    next[comp.id] = clamp(current + direction * speed, 0, 1);
  }

  return next;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function portsOf(type: keyof typeof CATALOG) {
  return CATALOG[type].ports;
}
