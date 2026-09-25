import { portsForComponent } from "./catalog";
import type { Circuit, ComponentType, PlacedComponent, Tube } from "./types";

export interface PortEndpoint {
  componentId: string;
  portId: string;
}

export type ConnectionValidation =
  { valid: true; medium: Tube["medium"] } | { valid: false; message: string };

const TECHNICAL_PREFIX: Record<ComponentType, string> = {
  source: "1P",
  valve32: "1V",
  valve52: "1V",
  valve42: "1V",
  valve53: "1V",
  cylinderSingle: "1A",
  cylinderDouble: "1A",
  sensor: "1S",
  // escape e elementos de processamento seguem a notação da apostila
  exhaust: "0Z",
  valveOr: "1V",
  valveAnd: "1V",
  valveTimer: "1V",
  checkValve: "1V",
  quickExhaust: "1Y",
  throttleOneWay: "1Y",
  throttle: "1Y",
  counter: "1C",
  lubrifil: "0Z",
  conservationUnit: "0Z",
  rotaryMotor: "1A",
  rotaryOscillator: "1A",
  rotaryCylinder: "1A",
};

export function nextTechnicalLabel(type: ComponentType, components: PlacedComponent[]) {
  const prefix = TECHNICAL_PREFIX[type];
  const expression = new RegExp(`^${prefix}(\\d+)$`, "i");
  const greatest = components.reduce((maximum, component) => {
    const match = expression.exec(component.label.trim());
    const value = match?.[1] ? Number(match[1]) : 0;
    return Math.max(maximum, value);
  }, 0);
  return `${prefix}${greatest + 1}`;
}

export function getPort(circuit: Circuit, endpoint: PortEndpoint) {
  const component = circuit.components.find((item) => item.id === endpoint.componentId);
  if (!component) return null;
  const port = portsForComponent(component).find((item) => item.id === endpoint.portId);
  return port ? { component, port } : null;
}

const sameEndpoint = (a: PortEndpoint, b: PortEndpoint) =>
  a.componentId === b.componentId && a.portId === b.portId;

export function validateConnection(
  circuit: Circuit,
  from: PortEndpoint,
  to: PortEndpoint,
): ConnectionValidation {
  if (sameEndpoint(from, to)) {
    return { valid: false, message: "Selecione uma porta de destino diferente." };
  }

  const source = getPort(circuit, from);
  const destination = getPort(circuit, to);
  if (!source || !destination) {
    return { valid: false, message: "Uma das portas não existe na configuração atual." };
  }

  if (source.port.domain !== destination.port.domain) {
    return { valid: false, message: "As portas pertencem a domínios incompatíveis." };
  }

  const duplicate = circuit.tubes.some(
    (tube) =>
      (sameEndpoint(tube.from, from) && sameEndpoint(tube.to, to)) ||
      (sameEndpoint(tube.from, to) && sameEndpoint(tube.to, from)),
  );
  if (duplicate) {
    return { valid: false, message: "Estas portas já estão conectadas." };
  }

  return { valid: true, medium: source.port.domain };
}

/** Remove um componente e, junto, toda mangueira ligada a ele. */
export function removeComponent(circuit: Circuit, componentId: string): Circuit {
  return {
    components: circuit.components.filter((component) => component.id !== componentId),
    tubes: circuit.tubes.filter(
      (tube) => tube.from.componentId !== componentId && tube.to.componentId !== componentId,
    ),
  };
}

/** Remove uma única mangueira, preservando os componentes. */
export function removeTube(circuit: Circuit, tubeId: string): Circuit {
  return {
    ...circuit,
    tubes: circuit.tubes.filter((tube) => tube.id !== tubeId),
  };
}

/** Quantidade de mangueiras conectadas a um componente. */
export function countAttachedTubes(circuit: Circuit, componentId: string): number {
  return circuit.tubes.filter(
    (tube) => tube.from.componentId === componentId || tube.to.componentId === componentId,
  ).length;
}

/** Remove linhas órfãs quando uma porta configurável deixa de existir. */
export function sanitizeCircuit(circuit: Circuit): Circuit {
  const tubes = circuit.tubes.filter(
    (tube) => getPort(circuit, tube.from) !== null && getPort(circuit, tube.to) !== null,
  );
  return tubes.length === circuit.tubes.length ? circuit : { ...circuit, tubes };
}

/**
 * Traçado ortogonal de uma mangueira entre duas portas.
 *
 * Sem ajuste manual a linha sai reto da origem, corre na horizontal na altura
 * média e desce reto até o destino. `midY` levanta ou abaixa esse trecho
 * horizontal; `midX` desloca lateralmente o primeiro cotovelo, criando um
 * degrau que permite contornar componentes.
 */
export function tubePath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  midY?: number,
  midX?: number,
): string {
  const y = midY ?? a.y + (b.y - a.y) / 2;
  // sem ajuste lateral a coluna vertical fica sobre a porta de destino
  const x = midX ?? b.x;
  if (x === b.x) return `M${a.x} ${a.y} V${y} H${b.x} V${b.y}`;
  return `M${a.x} ${a.y} V${y} H${x} V${b.y} H${b.x}`;
}