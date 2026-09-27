import { componentSize, componentTransform, portsForComponent } from "@/lib/pneumatics/catalog";
import { tubePath } from "@/lib/pneumatics/circuit";
import type { Circuit, RuntimeState, SolveResult } from "@/lib/pneumatics/types";
import { ComponentGlyph } from "./ComponentGlyph";

interface TechnicalDiagramProps {
  circuit: Circuit;
  runtime: RuntimeState;
  solved: SolveResult;
}

const bounds = (circuit: Circuit) => {
  if (!circuit.components.length) {
    return { width: 960, height: 560, offsetX: 0, offsetY: 0 };
  }
  const margin = 48;
  const minX = Math.min(...circuit.components.map((comp) => comp.x));
  const minY = Math.min(...circuit.components.map((comp) => comp.y));
  const maxX = Math.max(...circuit.components.map((comp) => comp.x + componentSize(comp).width));
  const maxY = Math.max(...circuit.components.map((comp) => comp.y + componentSize(comp).height));
  return {
    width: Math.max(1, maxX - minX + margin * 2),
    height: Math.max(1, maxY - minY + margin * 2),
    offsetX: margin - minX,
    offsetY: margin - minY,
  };
};

const portPosition = (
  circuit: Circuit,
  componentId: string,
  portId: string,
  offsetX: number,
  offsetY: number,
) => {
  const comp = circuit.components.find((item) => item.id === componentId);
  const port = comp ? portsForComponent(comp).find((item) => item.id === portId) : undefined;
  return comp && port ? { x: comp.x + port.x + offsetX, y: comp.y + port.y + offsetY } : null;
};

const orthogonalPath = tubePath;

export function TechnicalDiagram({ circuit, runtime, solved }: TechnicalDiagramProps) {
  const size = bounds(circuit);
  const printScale = Math.min(1, 1000 / size.width, 590 / size.height);

  return (
    <section className="technical-sheet" aria-label="Saída técnica do diagrama pneumático">
      <header className="technical-sheet__header">
        <div>
          <p>AutoMatikLab · Diagrama pneumático</p>
          <h1>Esquema técnico do circuito</h1>
        </div>
        <dl>
          <div>
            <dt>Norma visual</dt>
            <dd>ISO 1219</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              {solved.conflicts.size > 0
                ? "Conflito pressão/escape"
                : solved.pressurized.size > 0
                  ? "Pressurizado"
                  : "Sem pressão"}
            </dd>
          </div>
        </dl>
      </header>

      <div
        className="technical-sheet__viewport"
        style={{ width: size.width * printScale, height: size.height * printScale }}
      >
        <div
          className="technical-sheet__diagram"
          style={{
            width: size.width,
            height: size.height,
            transform: `scale(${printScale})`,
            transformOrigin: "top left",
          }}
        >
          <svg className="absolute inset-0 size-full" viewBox={`0 0 ${size.width} ${size.height}`}>
            <defs>
              <marker
                id="technical-flow-arrow"
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <path d="M0 0 L7 3.5 L0 7 Z" className="fill-air" />
              </marker>
            </defs>
            {circuit.tubes.map((tube) => {
              const a = portPosition(
                circuit,
                tube.from.componentId,
                tube.from.portId,
                size.offsetX,
                size.offsetY,
              );
              const b = portPosition(
                circuit,
                tube.to.componentId,
                tube.to.portId,
                size.offsetX,
                size.offsetY,
              );
              if (!a || !b) return null;
              const charged =
                solved.pressurized.has(`${tube.from.componentId}:${tube.from.portId}`) ||
                solved.pressurized.has(`${tube.to.componentId}:${tube.to.portId}`);
              const conflicted =
                solved.conflicts.has(`${tube.from.componentId}:${tube.from.portId}`) ||
                solved.conflicts.has(`${tube.to.componentId}:${tube.to.portId}`);
              return (
                <path
                  key={tube.id}
                  d={orthogonalPath(a, b, tube.midY, tube.midX)}
                  className={
                    conflicted
                      ? "fill-none stroke-destructive"
                      : charged
                        ? "fill-none stroke-air"
                        : "fill-none stroke-steel"
                  }
                  strokeWidth={charged || conflicted ? 2.5 : 1.7}
                  markerEnd={charged && !conflicted ? "url(#technical-flow-arrow)" : undefined}
                />
              );
            })}
          </svg>

          {circuit.components.map((comp) => {
            const sensorOn =
              comp.type === "sensor"
                ? comp.trigger === "retracted"
                  ? (runtime.strokes[comp.targetId ?? ""] ?? 0) <= 0.02
                  : (runtime.strokes[comp.targetId ?? ""] ?? 0) >= 0.98
                : false;
            return (
              <div
                key={comp.id}
                className="absolute"
                style={{ left: comp.x + size.offsetX, top: comp.y + size.offsetY }}
              >
                <div style={{ transform: componentTransform(comp), transformOrigin: "top left" }}>
                  <div
                    style={{
                      transform: `scale(${comp.mirroredX ? -1 : 1}, ${comp.mirroredY ? -1 : 1})`,
                      transformOrigin: "center",
                    }}
                  >
                    <ComponentGlyph
                      comp={comp}
                      stroke={runtime.strokes[comp.id] ?? 0}
                      actuated={!!solved.actuated[comp.id]}
                      signal={comp.type === "sensor" ? sensorOn : !!runtime.signals[comp.id]}
                      pressurizedPorts={solved.pressurized}
                      count={runtime.counts?.[comp.id] ?? 0}
                      technical
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}