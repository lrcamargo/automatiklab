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
      // vias numeradas da esquerda para a direita: 2 | 4 em cima, 3 | 1 | 5 embaixo
      pneumaticPort("A", "2", 166, 0, "work"),
      pneumaticPort("B", "4", 210, 0, "work"),
      pneumaticPort("R1", "3", 158, 112, "exhaust"),
      pneumaticPort("P", "1", 186, 129, "supply"),
      pneumaticPort("R2", "5", 216, 112, "exhaust"),
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
  exhaust: {
    type: "exhaust",
    name: "Escape para a atmosfera",
    short: "Escape",
    description:
      "Silenciador de exaustão. Liga uma via de escape à atmosfera, descarregando a linha.",
    family: "alimentacao",
    width: 72,
    height: 84,
    ports: [pneumaticPort("R", "3", 36, 0, "exhaust")],
  },
  valveOr: {
    type: "valveOr",
    name: "Válvula alternadora (OU)",
    short: "Elemento OU",
    description:
      "Recebe sinais em 1 e 1' e envia o de maior pressão para 2. Só falta sinal em 2 quando as duas entradas estão despressurizadas.",
    family: "sinal",
    width: 120,
    height: 110,
    ports: [
      pneumaticPort("A", "2", 60, 0, "work"),
      pneumaticPort("P1", "1", 24, 110, "supply"),
      pneumaticPort("P2", "1'", 96, 110, "supply"),
    ],
  },
  valveAnd: {
    type: "valveAnd",
    name: "Válvula de simultaneidade (E)",
    short: "Elemento E",
    description:
      "Só envia sinal para 2 quando as duas entradas 1 e 1' estão pressurizadas ao mesmo tempo. Usada em comando bimanual de segurança.",
    family: "sinal",
    width: 120,
    height: 110,
    ports: [
      pneumaticPort("A", "2", 60, 0, "work"),
      pneumaticPort("P1", "1", 24, 110, "supply"),
      pneumaticPort("P2", "1'", 96, 110, "supply"),
    ],
  },
  valveTimer: {
    type: "valveTimer",
    name: "Válvula temporizadora",
    short: "Temporizadora",
    description:
      "Retarda o sinal pneumático: a saída 2 só é liberada depois do tempo ajustado com sinal presente em 12.",
    family: "sinal",
    width: 168,
    height: 129,
    ports: [
      pneumaticPort("A", "2", 104, 0, "work"),
      pneumaticPort("Z", "12", 0, 61, "control"),
      pneumaticPort("P", "1", 90, 129, "supply"),
      pneumaticPort("R", "3", 120, 112, "exhaust"),
    ],
  },
  checkValve: {
    type: "checkValve",
    name: "Válvula de retenção",
    short: "Retenção",
    description: "Permite a passagem do ar em um sentido e bloqueia o sentido contrário.",
    family: "sinal",
    width: 120,
    height: 72,
    ports: [pneumaticPort("P", "1", 0, 36, "supply"), pneumaticPort("A", "2", 120, 36, "work")],
  },
  quickExhaust: {
    type: "quickExhaust",
    name: "Válvula de escape rápido",
    short: "Escape rápido",
    description:
      "Descarrega a câmara do cilindro direto para a atmosfera pela via 3, acelerando o movimento.",
    family: "atuacao",
    width: 132,
    height: 110,
    ports: [
      pneumaticPort("P", "1", 0, 46, "supply"),
      pneumaticPort("A", "2", 132, 46, "work"),
      pneumaticPort("R", "3", 66, 110, "exhaust"),
    ],
  },
  throttleOneWay: {
    type: "throttleOneWay",
    name: "Reguladora de fluxo unidirecional",
    short: "Fluxo unidirecional",
    description:
      "Estrangula o ar em um sentido e libera passagem plena no outro, pela retenção em paralelo. Controla a velocidade do cilindro.",
    family: "atuacao",
    width: 132,
    height: 96,
    ports: [pneumaticPort("P", "1", 0, 48, "supply"), pneumaticPort("A", "2", 132, 48, "work")],
  },
  throttle: {
    type: "throttle",
    name: "Reguladora de fluxo bidirecional",
    short: "Fluxo bidirecional",
    description: "Estrangula a passagem nos dois sentidos, com ajuste único de abertura.",
    family: "atuacao",
    width: 120,
    height: 84,
    ports: [pneumaticPort("P", "1", 0, 42, "supply"), pneumaticPort("A", "2", 120, 42, "work")],
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