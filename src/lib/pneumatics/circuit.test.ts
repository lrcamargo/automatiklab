import { describe, expect, it } from "vitest";
import { portsForComponent } from "./catalog";
import { nextTechnicalLabel, sanitizeCircuit, validateConnection } from "./circuit";
import { springReturnCircuit } from "./presets";
import type { PlacedComponent } from "./types";

describe("modelo de circuito", () => {
  it("mantém a numeração única entre componentes da mesma família", () => {
    const components: PlacedComponent[] = [
      { id: "v1", type: "valve32", x: 0, y: 0, label: "1V1" },
      { id: "v2", type: "valve52", x: 0, y: 0, label: "1V3" },
      { id: "a1", type: "cylinderSingle", x: 0, y: 0, label: "1A1" },
    ];

    expect(nextTechnicalLabel("valve32", components)).toBe("1V4");
    expect(nextTechnicalLabel("valve52", components)).toBe("1V4");
    expect(nextTechnicalLabel("cylinderDouble", components)).toBe("1A2");
  });

  it("expõe a porta 14 somente quando há piloto pneumático", () => {
    const piloted: PlacedComponent = {
      id: "v1",
      type: "valve32",
      x: 0,
      y: 0,
      label: "1V1",
      actuation: "pilotoSimples",
      returnType: "mola",
    };
    const manual = { ...piloted, actuation: "botao" as const };

    expect(portsForComponent(piloted).some((port) => port.id === "14")).toBe(true);
    expect(portsForComponent(manual).some((port) => port.id === "14")).toBe(false);
  });

  it("rejeita linhas duplicadas e aceita uma nova ligação pneumática", () => {
    const circuit = springReturnCircuit();
    const duplicate = validateConnection(
      circuit,
      { componentId: "src1", portId: "P" },
      { componentId: "v1", portId: "P" },
    );
    const valid = validateConnection(
      circuit,
      { componentId: "btn1", portId: "R" },
      { componentId: "v1", portId: "R" },
    );

    expect(duplicate.valid).toBe(false);
    expect(valid).toEqual({ valid: true, medium: "pneumatic" });
  });

  it("remove uma linha órfã quando a porta piloto deixa de existir", () => {
    const circuit = springReturnCircuit();
    const changed = {
      ...circuit,
      components: circuit.components.map((component) =>
        component.id === "v1" ? { ...component, actuation: "botao" as const } : component,
      ),
    };

    const sanitized = sanitizeCircuit(changed);
    expect(sanitized.tubes.some((tube) => tube.to.portId === "14")).toBe(false);
    expect(sanitized.tubes).toHaveLength(circuit.tubes.length - 1);
  });
});
