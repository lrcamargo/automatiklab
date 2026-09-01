import type { ComponentDef, ComponentType } from "./types";

export const CATALOG: Record<ComponentType, ComponentDef> = {
  source: {
    type: "source",
    name: "Fonte de ar comprimido",
    short: "Fonte",
    description:
      "Unidade de alimentação que fornece ar pressurizado ao circuito. Todo caminho de pressão parte daqui e deve entrar nas válvulas pela porta 1.",
    family: "alimentacao",
    width: 150,
    height: 100,
    ports: [{ id: "P", label: "1", x: 150, y: 50, kind: "supply" }],
  },
  valve32: {
    type: "valve32",
    name: "Válvula direcional 3/2",
    short: "3/2 vias",
    description:
      "Três vias e duas posições. Em repouso conecta o trabalho ao escape; acionada, liga a alimentação ao trabalho.",
    family: "comando",
    width: 196,
    height: 129,
    ports: [
      { id: "A", label: "2", x: 133, y: 0, kind: "work" },
      { id: "P", label: "1", x: 115, y: 129, kind: "supply" },
      { id: "R", label: "3", x: 151, y: 129, kind: "exhaust" },
    ],
  },
  valve52: {
    type: "valve52",
    name: "Válvula direcional 5/2",
    short: "5/2 vias",
    description:
      "Cinco vias e duas posições. Alterna a pressão entre as duas câmaras de um cilindro de dupla ação.",
    family: "comando",
    width: 238,
    height: 129,
    ports: [
      { id: "A", label: "2", x: 141, y: 0, kind: "work" },
      { id: "B", label: "4", x: 188, y: 0, kind: "work" },
      { id: "R1", label: "3", x: 134, y: 129, kind: "exhaust" },
      { id: "P", label: "1", x: 164, y: 129, kind: "supply" },
      { id: "R2", label: "5", x: 196, y: 129, kind: "exhaust" },
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
    height: 92,
    ports: [{ id: "A", label: "2", x: 37, y: 92, kind: "work" }],
  },
  cylinderDouble: {
    type: "cylinderDouble",
    name: "Cilindro de dupla ação",
    short: "Dupla ação",
    description:
      "Avança e recua por ar comprimido, com pressão alternada entre as câmaras 2 e 4.",
    family: "atuacao",
    width: 242,
    height: 92,
    ports: [
      { id: "A", label: "2", x: 37, y: 92, kind: "work" },
      { id: "B", label: "4", x: 163, y: 92, kind: "work" },
    ],
  },

  button: {
    type: "button",
    name: "Botão de comando",
    short: "Botão",
    description:
      "Sinal de entrada do operador. Pode ser momentâneo (pulso) ou com trava (liga/desliga).",
    family: "sinal",
    width: 96,
    height: 96,
    ports: [],
  },
  sensor: {
    type: "sensor",
    name: "Sensor de fim de curso",
    short: "Sensor",
    description:
      "Detecta o cilindro em posição avançada ou recuada e gera um sinal para acionar uma válvula.",
    family: "sinal",
    width: 110,
    height: 76,
    ports: [],
  },
};

export const FAMILIES: { id: ComponentDef["family"]; label: string }[] = [
  { id: "alimentacao", label: "Alimentação" },
  { id: "comando", label: "Comando" },
  { id: "atuacao", label: "Atuação" },
  { id: "sinal", label: "Sinais" },
];

export const CATALOG_LIST = Object.values(CATALOG);
