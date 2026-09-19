import { describe, expect, it } from "vitest";
import { solveCircuit, stepStrokes, stepTimers, strokeDirection } from "./engine";
import { basicCircuit, springReturnCircuit } from "./presets";
import { portKey, type Circuit, type RuntimeState } from "./types";

const runtime = (patch: Partial<RuntimeState> = {}): RuntimeState => ({
  strokes: {},
  signals: {},
  valvePositions: {},
  ...patch,
});

describe("motor pneumático topológico", () => {
  it("leva o sinal do botão pela porta 2 até o piloto 14", () => {
    const circuit = springReturnCircuit();

    const idle = solveCircuit(circuit, runtime());
    expect(idle.actuated["v1"]).toBe(false);
    expect(idle.vented.has(portKey("v1", "14"))).toBe(true);
    expect(idle.pressurized.has(portKey("cil1", "A"))).toBe(false);

    const commanded = solveCircuit(circuit, runtime({ signals: { btn1: true } }));
    expect(commanded.actuated["v1"]).toBe(true);
    expect(commanded.pressurized.has(portKey("btn1", "A"))).toBe(true);
    expect(commanded.pressurized.has(portKey("v1", "14"))).toBe(true);
    expect(commanded.pressurized.has(portKey("cil1", "A"))).toBe(true);
  });

  it("retorna a válvula por mola quando o piloto é despressurizado", () => {
    const circuit = springReturnCircuit();
    const released = solveCircuit(circuit, runtime({ valvePositions: { v1: true } }));

    expect(released.actuated["v1"]).toBe(false);
  });

  it("comuta a válvula 5/2 e pressuriza a câmara correspondente", () => {
    const circuit = basicCircuit();
    const commanded = solveCircuit(circuit, runtime({ signals: { btn1: true } }));

    expect(commanded.actuated["v1"]).toBe(true);
    expect(commanded.pressurized.has(portKey("cil1", "B"))).toBe(true);
    expect(commanded.pressurized.has(portKey("cil1", "A"))).toBe(false);
  });

  it("conserva a posição de uma válvula com duplo piloto", () => {
    const circuit: Circuit = {
      components: [
        { id: "src", type: "source", x: 0, y: 0, label: "1P1", pressure: 6 },
        { id: "advance", type: "button", x: 0, y: 0, label: "1S1" },
        { id: "return", type: "button", x: 0, y: 0, label: "1S2" },
        {
          id: "valve",
          type: "valve52",
          x: 0,
          y: 0,
          label: "1V1",
          actuation: "pilotoSimples",
          returnType: "pilotoSimples",
        },
      ],
      tubes: [
        {
          id: "s1",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "advance", portId: "P" },
        },
        {
          id: "s2",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "return", portId: "P" },
        },
        {
          id: "p14",
          medium: "pneumatic",
          from: { componentId: "advance", portId: "A" },
          to: { componentId: "valve", portId: "14" },
        },
        {
          id: "p12",
          medium: "pneumatic",
          from: { componentId: "return", portId: "A" },
          to: { componentId: "valve", portId: "12" },
        },
      ],
    };

    const advanced = solveCircuit(circuit, runtime({ signals: { advance: true } }));
    expect(advanced.actuated["valve"]).toBe(true);

    const memorized = solveCircuit(circuit, runtime({ valvePositions: advanced.actuated }));
    expect(memorized.actuated["valve"]).toBe(true);

    const returned = solveCircuit(
      circuit,
      runtime({
        signals: { return: true },
        valvePositions: memorized.actuated,
      }),
    );
    expect(returned.actuated["valve"]).toBe(false);
  });

  it("detecta alimentação ligada diretamente ao escape", () => {
    const circuit: Circuit = {
      components: [
        { id: "src", type: "source", x: 0, y: 0, label: "1P1", pressure: 6 },
        {
          id: "valve",
          type: "valve32",
          x: 0,
          y: 0,
          label: "1V1",
          actuation: "botao",
          returnType: "mola",
        },
      ],
      tubes: [
        {
          id: "line",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "valve", portId: "R" },
        },
      ],
    };

    const solved = solveCircuit(circuit, runtime());
    expect(solved.conflicts.has(portKey("src", "P"))).toBe(true);
    expect(solved.pressurized.has(portKey("src", "P"))).toBe(false);
  });

  it("move o cilindro sem ultrapassar os limites do curso", () => {
    const circuit = springReturnCircuit();
    const state = runtime({ strokes: { cil1: 0.9 }, signals: { btn1: true } });
    const solved = solveCircuit(circuit, state);

    expect(strokeDirection(circuit.components[3]!, solved)).toBe(1);
    expect(stepStrokes(circuit, state, solved, 1)["cil1"]).toBe(1);
  });
});

describe("elementos de processamento de sinal", () => {
  const base = (extra: Circuit["components"], tubes: Circuit["tubes"]): Circuit => ({
    components: [{ id: "src", type: "source", x: 0, y: 0, label: "1P1", pressure: 6 }, ...extra],
    tubes,
  });
  const run = (circuit: Circuit) =>
    solveCircuit(circuit, { strokes: {}, signals: {}, valvePositions: {} });

  it("OU: entrega sinal quando qualquer entrada é pressurizada", () => {
    const circuit = base(
      [
        { id: "or", type: "valveOr", x: 0, y: 0, label: "1V1" },
        { id: "esc", type: "exhaust", x: 0, y: 0, label: "0Z1" },
      ],
      [
        {
          id: "t1",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "or", portId: "P1" },
        },
        {
          id: "t2",
          medium: "pneumatic",
          from: { componentId: "or", portId: "P2" },
          to: { componentId: "esc", portId: "R" },
        },
      ],
    );
    expect(run(circuit).pressurized.has("or:A")).toBe(true);
  });

  it("E: exige as duas entradas pressurizadas", () => {
    const oneInput = base(
      [{ id: "and", type: "valveAnd", x: 0, y: 0, label: "1V1" }],
      [
        {
          id: "t1",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "and", portId: "P1" },
        },
      ],
    );
    expect(run(oneInput).pressurized.has("and:A")).toBe(false);

    const bothInputs = base(
      [
        { id: "and", type: "valveAnd", x: 0, y: 0, label: "1V1" },
        { id: "src2", type: "source", x: 0, y: 0, label: "1P2", pressure: 6 },
      ],
      [
        {
          id: "t1",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "and", portId: "P1" },
        },
        {
          id: "t2",
          medium: "pneumatic",
          from: { componentId: "src2", portId: "P" },
          to: { componentId: "and", portId: "P2" },
        },
      ],
    );
    expect(run(bothInputs).pressurized.has("and:A")).toBe(true);
  });

  it("temporizadora só libera a saída depois do retardo", () => {
    const circuit = base(
      [{ id: "tm", type: "valveTimer", x: 0, y: 0, label: "1V1", delay: 1 }],
      [
        {
          id: "t1",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "tm", portId: "P" },
        },
      ],
    );
    const waiting = solveCircuit(circuit, {
      strokes: {},
      signals: {},
      valvePositions: {},
      timers: { tm: false },
    });
    expect(waiting.pressurized.has("tm:A")).toBe(false);

    const elapsed = solveCircuit(circuit, {
      strokes: {},
      signals: {},
      valvePositions: {},
      timers: { tm: true },
    });
    expect(elapsed.pressurized.has("tm:A")).toBe(true);
  });

  it("stepTimers zera a contagem quando o sinal em 12 some", () => {
    const circuit = base(
      [{ id: "tm", type: "valveTimer", x: 0, y: 0, label: "1V1", delay: 1 }],
      [],
    );
    const solved = run(circuit);
    const out = stepTimers(
      circuit,
      { strokes: {}, signals: {}, valvePositions: {}, timerElapsed: { tm: 0.8 } },
      solved,
      0.5,
    );
    expect(out.timerElapsed["tm"]).toBe(0);
    expect(out.timers["tm"]).toBe(false);
  });

  it("escape descarrega a linha ligada a ele", () => {
    const circuit = base(
      [{ id: "esc", type: "exhaust", x: 0, y: 0, label: "0Z1" }],
      [
        {
          id: "t1",
          medium: "pneumatic",
          from: { componentId: "src", portId: "P" },
          to: { componentId: "esc", portId: "R" },
        },
      ],
    );
    expect(run(circuit).conflicts.size).toBeGreaterThan(0);
  });
});