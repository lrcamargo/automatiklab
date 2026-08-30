import type { Circuit } from "./types";

/** Circuito didático inicial: botão -> válvula 5/2 -> cilindro de dupla ação. */
export function basicCircuit(): Circuit {
  return {
    components: [
      { id: "src1", type: "source", x: 60, y: 300, label: "Fonte 6 bar" },
      {
        id: "btn1",
        type: "button",
        x: 80,
        y: 90,
        label: "Comando S1",
        momentary: false,
      },
      {
        id: "v1",
        type: "valve52",
        x: 300,
        y: 260,
        label: "Válvula V1",
        actuatorId: "btn1",
      },
      {
        id: "cil1",
        type: "cylinderDouble",
        x: 600,
        y: 250,
        label: "Cilindro A",
        speed: 0.8,
      },
      {
        id: "sen1",
        type: "sensor",
        x: 620,
        y: 130,
        label: "Fim de curso A1",
        targetId: "cil1",
        trigger: "extended",
      },
    ],
    tubes: [
      { id: "t1", from: { componentId: "src1", portId: "P" }, to: { componentId: "v1", portId: "P" } },
      { id: "t2", from: { componentId: "v1", portId: "A" }, to: { componentId: "cil1", portId: "A" } },
      { id: "t3", from: { componentId: "v1", portId: "B" }, to: { componentId: "cil1", portId: "B" } },
    ],
  };
}

/** Circuito de simples ação com retorno por mola. */
export function springReturnCircuit(): Circuit {
  return {
    components: [
      { id: "src1", type: "source", x: 60, y: 320, label: "Fonte 6 bar" },
      { id: "btn1", type: "button", x: 90, y: 110, label: "Comando S1", momentary: true },
      { id: "v1", type: "valve32", x: 300, y: 290, label: "Válvula V1", actuatorId: "btn1" },
      { id: "cil1", type: "cylinderSingle", x: 580, y: 295, label: "Cilindro B", speed: 1 },
    ],
    tubes: [
      { id: "t1", from: { componentId: "src1", portId: "P" }, to: { componentId: "v1", portId: "P" } },
      { id: "t2", from: { componentId: "v1", portId: "A" }, to: { componentId: "cil1", portId: "A" } },
    ],
  };
}
