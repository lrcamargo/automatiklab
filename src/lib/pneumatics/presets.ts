import type { Circuit } from "./types";

/** Circuito didático: botão 3/2 -> piloto 14 -> válvula 5/2 -> cilindro. */
export function basicCircuit(): Circuit {
  return {
    components: [
      { id: "src1", type: "source", x: 10, y: 450, label: "1P1", pressure: 6 },
      {
        id: "btn1",
        type: "valve32",
        actuation: "botao",
        returnType: "mola",
        x: 0,
        y: 190,
        label: "1S1",
        momentary: true,
      },
      {
        id: "v1",
        type: "valve52",
        x: 100,
        y: 300,
        label: "1V1",
        actuation: "pilotoSimples",
        returnType: "mola",
      },
      {
        id: "cil1",
        type: "cylinderDouble",
        x: 90,
        y: 30,
        label: "1A1",
        speed: 0.8,
      },
    ],
    tubes: [
      {
        id: "t1",
        medium: "pneumatic",
        from: { componentId: "src1", portId: "P" },
        to: { componentId: "v1", portId: "P" },
      },
      {
        id: "t2",
        medium: "pneumatic",
        from: { componentId: "v1", portId: "A" },
        to: { componentId: "cil1", portId: "A" },
      },
      {
        id: "t3",
        medium: "pneumatic",
        from: { componentId: "v1", portId: "B" },
        to: { componentId: "cil1", portId: "B" },
      },
      {
        id: "t4",
        medium: "pneumatic",
        from: { componentId: "src1", portId: "P" },
        to: { componentId: "btn1", portId: "P" },
      },
      {
        id: "t5",
        medium: "pneumatic",
        from: { componentId: "btn1", portId: "A" },
        to: { componentId: "v1", portId: "14" },
      },
    ],
  };
}

/** Circuito de simples ação com comando pneumático e retorno por mola. */
export function springReturnCircuit(): Circuit {
  return {
    components: [
      { id: "src1", type: "source", x: 10, y: 450, label: "1P1", pressure: 6 },
      {
        id: "btn1",
        type: "valve32",
        actuation: "botao",
        returnType: "mola",
        x: 0,
        y: 190,
        label: "1S1",
        momentary: true,
      },
      {
        id: "v1",
        type: "valve32",
        x: 110,
        y: 300,
        label: "1V1",
        actuation: "pilotoSimples",
        returnType: "mola",
      },
      {
        id: "cil1",
        type: "cylinderSingle",
        x: 90,
        y: 50,
        label: "1A1",
        speed: 1,
      },
    ],
    tubes: [
      {
        id: "t1",
        medium: "pneumatic",
        from: { componentId: "src1", portId: "P" },
        to: { componentId: "v1", portId: "P" },
      },
      {
        id: "t2",
        medium: "pneumatic",
        from: { componentId: "v1", portId: "A" },
        to: { componentId: "cil1", portId: "A" },
      },
      {
        id: "t3",
        medium: "pneumatic",
        from: { componentId: "src1", portId: "P" },
        to: { componentId: "btn1", portId: "P" },
      },
      {
        id: "t4",
        medium: "pneumatic",
        from: { componentId: "btn1", portId: "A" },
        to: { componentId: "v1", portId: "14" },
      },
    ],
  };
}