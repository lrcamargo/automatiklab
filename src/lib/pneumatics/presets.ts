import type { Circuit } from "./types";

/** Circuito didático inicial: botão -> válvula 5/2 -> cilindro de dupla ação. */
export function basicCircuit(): Circuit {
  return {
    components: [
      { id: "src1", type: "source", x: 10, y: 450, label: "1P1" },
      {
        id: "btn1",
        type: "button",
        x: 0,
        y: 190,
        label: "1S1",
        momentary: false,
      },
      {
        id: "v1",
        type: "valve52",
        x: 100,
        y: 300,
        label: "1V1",
        actuatorId: "btn1",
      },
      {
        id: "cil1",
        type: "cylinderDouble",
        x: 90,
        y: 30,
        label: "1A1",
        speed: 0.8,
      },
      {
        id: "sen1",
        type: "sensor",
        x: 270,
        y: 180,
        label: "1S2",
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
      { id: "src1", type: "source", x: 10, y: 450, label: "1P1" },
      { id: "btn1", type: "button", x: 0, y: 190, label: "1S1", momentary: true },
      { id: "v1", type: "valve32", x: 110, y: 300, label: "1V1", actuatorId: "btn1" },
      { id: "cil1", type: "cylinderSingle", x: 90, y: 50, label: "1A1", speed: 1 },
    ],
    tubes: [
      { id: "t1", from: { componentId: "src1", portId: "P" }, to: { componentId: "v1", portId: "P" } },
      { id: "t2", from: { componentId: "v1", portId: "A" }, to: { componentId: "cil1", portId: "A" } },
    ],
  };
}
