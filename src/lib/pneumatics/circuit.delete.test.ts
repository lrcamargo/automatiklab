import { describe, expect, it } from "vitest";
import { removeComponent, removeTube } from "./circuit";
import { basicCircuit } from "./presets";

describe("remoção na bancada", () => {
  it("remove o componente e todas as mangueiras ligadas a ele", () => {
    const circuit = basicCircuit();
    // 1V1 é a válvula central: concentra alimentação, cilindro e piloto
    const before = circuit.tubes.filter(
      (tube) => tube.from.componentId === "v1" || tube.to.componentId === "v1",
    ).length;
    expect(before).toBeGreaterThan(0);

    const result = removeComponent(circuit, "v1");

    expect(result.components.some((component) => component.id === "v1")).toBe(false);
    expect(
      result.tubes.some((tube) => tube.from.componentId === "v1" || tube.to.componentId === "v1"),
    ).toBe(false);
    expect(result.tubes).toHaveLength(circuit.tubes.length - before);
  });

  it("não deixa mangueira órfã apontando para componente inexistente", () => {
    const result = removeComponent(basicCircuit(), "cil1");
    const ids = new Set(result.components.map((component) => component.id));

    for (const tube of result.tubes) {
      expect(ids.has(tube.from.componentId)).toBe(true);
      expect(ids.has(tube.to.componentId)).toBe(true);
    }
  });

  it("remove apenas a mangueira indicada, preservando os componentes", () => {
    const circuit = basicCircuit();
    const target = circuit.tubes[0]!;

    const result = removeTube(circuit, target.id);

    expect(result.tubes).toHaveLength(circuit.tubes.length - 1);
    expect(result.tubes.some((tube) => tube.id === target.id)).toBe(false);
    expect(result.components).toHaveLength(circuit.components.length);
  });

  it("ignora ids desconhecidos sem alterar o circuito", () => {
    const circuit = basicCircuit();

    expect(removeComponent(circuit, "nao-existe").components).toHaveLength(
      circuit.components.length,
    );
    expect(removeTube(circuit, "nao-existe").tubes).toHaveLength(circuit.tubes.length);
  });
});