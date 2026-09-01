import type { ComponentDef, ComponentType } from "./types";

export const CATALOG: Record<ComponentType, ComponentDef> = {
  source: {
    type: "source",
    name: "Fonte de ar comprimido",
    short: "Fonte",
    description:
      "Unidade de alimentação que fornece ar pressurizado ao circuito. Todo caminho de pressão parte daqui.",
    family: "alimentacao",
    width: 120,
    height: 80,
    ports: [{ id: "P", label: "1 (P)", x: 120, y: 40, kind: "supply" }],
  },
  valve32: {
    type: "valve32",
    name: "Válvula direcional 3/2",
    short: "3/2 vias",
    description:
      "Três vias e duas posições. Em repouso conecta o trabalho ao escape; acionada, liga a alimentação ao trabalho.",
    family: "comando",
    width: 140,
    height: 92,
    ports: [
      { id: "A", label: "2 (A)", x: 95, y: 0, kind: "work" },
      { id: "P", label: "1 (P)", x: 82, y: 92, kind: "supply" },
      { id: "R", label: "3 (R)", x: 108, y: 92, kind: "exhaust" },
    ],
  },
  valve52: {
    type: "valve52",
    name: "Válvula direcional 5/2",
    short: "5/2 vias",
    description:
      "Cinco vias e duas posições. Alterna a pressão entre as duas câmaras de um cilindro de dupla ação.",
    family: "comando",
    width: 170,
    height: 92,
    ports: [
      { id: "A", label: "2 (A)", x: 101, y: 0, kind: "work" },
      { id: "B", label: "4 (B)", x: 134, y: 0, kind: "work" },
      { id: "R1", label: "3 (R)", x: 96, y: 92, kind: "exhaust" },
      { id: "P", label: "1 (P)", x: 117, y: 92, kind: "supply" },
      { id: "R2", label: "5 (S)", x: 140, y: 92, kind: "exhaust" },
    ],
  },
  cylinderSingle: {
    type: "cylinderSingle",
    name: "Cilindro de simples ação",
    short: "Simples ação",
    description:
      "Avança com ar na câmara traseira e retorna por mola quando a linha é despressurizada.",
    family: "atuacao",
    width: 220,
    height: 84,
    ports: [{ id: "A", label: "2 (A)", x: 34, y: 84, kind: "work" }],
  },
  cylinderDouble: {
    type: "cylinderDouble",
    name: "Cilindro de dupla ação",
    short: "Dupla ação",
    description:
      "Avança e recua por ar comprimido, com pressão alternada entre as câmaras A e B.",
    family: "atuacao",
    width: 220,
    height: 84,
    ports: [
      { id: "A", label: "2 (A)", x: 34, y: 84, kind: "work" },
      { id: "B", label: "4 (B)", x: 148, y: 84, kind: "work" },
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
