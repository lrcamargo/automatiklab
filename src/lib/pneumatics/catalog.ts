import type { ActuationType, ComponentDef, ComponentType, PlacedComponent, PortDef } from "./types";

const pneumaticPort = (
  id: string,
  label: string,
  x: number,
  y: number,
  kind: PortDef["kind"],
): PortDef => ({ id, label, x, y, kind, domain: "pneumatic" });

export const CATALOG: Record<ComponentType, ComponentDef> = {
  source: {
    type: "source",
    name: "Fonte de ar comprimido",
    short: "Fonte",
    description:
      "Unidade de alimentação que fornece ar pressurizado ao circuito. Todo caminho de pressão parte daqui.",
    family: "alimentacao",
    width: 150,
    height: 100,
    ports: [pneumaticPort("P", "1", 150, 42, "supply")],
  },
  valve32: {
    type: "valve32",
    name: "Válvula direcional 3/2",
    short: "3/2 vias",
    description:
      "Três vias e duas posições. Em repouso conecta o trabalho ao escape; acionada, liga a alimentação ao trabalho.",
    family: "comando",
    width: 240,
    height: 129,
    ports: [
      pneumaticPort("A", "2", 150, 0, "work"),
      pneumaticPort("P", "1", 136, 129, "supply"),
      pneumaticPort("R", "3", 166, 112, "exhaust"),
    ],
  },
  valve52: {
    type: "valve52",
    name: "Válvula direcional 5/2",
    short: "5/2 vias",
    description:
      "Cinco vias e duas posições. Alterna a pressão entre as duas câmaras de um cilindro de dupla ação.",
    family: "comando",
    width: 288,
    height: 129,
    ports: [
      pneumaticPort("B", "4", 166, 0, "work"),
      pneumaticPort("A", "2", 210, 0, "work"),
      pneumaticPort("R2", "5", 158, 112, "exhaust"),
      pneumaticPort("P", "1", 186, 129, "supply"),
      pneumaticPort("R1", "3", 216, 112, "exhaust"),
    ],
  },
  cylinderSingle: {
    type: "cylinderSingle",
    name: "Cilindro de simples ação",
    short: "Simples ação",
    description:
      "Avança com ar na câmara traseira e retorna por mola quando a linha é despressurizada.",
    family: "atuacao",
    width: 242,
    height: 100,
    ports: [pneumaticPort("A", "2", 40, 100, "work")],
  },
  cylinderDouble: {
    type: "cylinderDouble",
    name: "Cilindro de dupla ação",
    short: "Dupla ação",
    description: "Avança e recua por ar comprimido, com pressão alternada entre as duas câmaras.",
    family: "atuacao",
    width: 242,
    height: 100,
    ports: [pneumaticPort("A", "2", 40, 100, "work"), pneumaticPort("B", "4", 168, 100, "work")],
  },
  button: {
    type: "button",
    name: "Válvula 3/2 acionada por botão",
    short: "Botão pneumático",
    description:
      "Válvula de sinal 3/2 normalmente fechada. Deve receber ar na porta 1 e enviar o sinal pneumático pela porta 2.",
    family: "sinal",
    width: 148,
    height: 110,
    ports: [
      pneumaticPort("A", "2", 78, 20, "work"),
      pneumaticPort("P", "1", 68, 102, "supply"),
      pneumaticPort("R", "3", 90, 92, "exhaust"),
    ],
  },
  sensor: {
    type: "sensor",
    name: "Válvula 3/2 de fim de curso",
    short: "Fim de curso",
    description:
      "Válvula de sinal 3/2 acionada mecanicamente pelo cilindro. Gera um sinal pneumático pela porta 2.",
    family: "sinal",
    width: 148,
    height: 110,
    ports: [
      pneumaticPort("A", "2", 80, 20, "work"),
      pneumaticPort("P", "1", 70, 102, "supply"),
      pneumaticPort("R", "3", 92, 92, "exhaust"),
    ],
  },
};

const PNEUMATIC_PILOTS = new Set<ActuationType>([
  "pilotoSimples",
  "pilotoDuplo",
  "servoPilotoSimples",
  "servoPilotoDuplo",
]);

export const hasPneumaticPilot = (type: ActuationType | undefined) =>
  type !== undefined && PNEUMATIC_PILOTS.has(type);

const pilotOffset = (type: ActuationType | undefined) => {
  switch (type) {
    case "pilotoDuplo":
    case "servoPilotoSimples":
      return 48;
    case "servoPilotoDuplo":
      return 72;
    default:
      return 24;
  }
};

/** Retorna as portas visíveis e conectáveis conforme a configuração da válvula. */
export function portsForComponent(comp: PlacedComponent): PortDef[] {
  const ports = [...CATALOG[comp.type].ports];
  if (comp.type !== "valve32" && comp.type !== "valve52") return ports;

  if (hasPneumaticPilot(comp.actuation)) {
    ports.push(pneumaticPort("14", "14", 72 - pilotOffset(comp.actuation), 61, "control"));
  }

  if (hasPneumaticPilot(comp.returnType)) {
    const rightEdge = comp.type === "valve32" ? 176 : 224;
    ports.push(pneumaticPort("12", "12", rightEdge + pilotOffset(comp.returnType), 61, "control"));
  }

  return ports;
}

export const FAMILIES: { id: ComponentDef["family"]; label: string }[] = [
  { id: "alimentacao", label: "Alimentação" },
  { id: "comando", label: "Comando" },
  { id: "atuacao", label: "Atuação" },
  { id: "sinal", label: "Sinais pneumáticos" },
];

export const CATALOG_LIST = Object.values(CATALOG);
