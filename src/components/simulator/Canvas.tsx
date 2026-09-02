import { useRef, type PointerEvent } from "react";
import { CATALOG } from "@/lib/pneumatics/catalog";
import type { Circuit, PlacedComponent, RuntimeState, SolveResult } from "@/lib/pneumatics/types";
import { ComponentGlyph } from "./ComponentGlyph";
import { cn } from "@/lib/utils";

interface CanvasProps {
  circuit: Circuit;
  runtime: RuntimeState;
  solved: SolveResult;
  selectedId: string | null;
  pendingPort: { componentId: string; portId: string } | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onPortClick: (componentId: string, portId: string) => void;
  onSignalDown: (comp: PlacedComponent) => void;
  onSignalUp: (comp: PlacedComponent) => void;
  onActivate: (comp: PlacedComponent) => void;
  blockedId: string | null;
  onDropComponent: (type: string, x: number, y: number) => void;
}

const GRID = 24;
const snap = (value: number) => Math.round(value / GRID) * GRID;
const PORT_ROLE = {
  supply: "alimentação/pressão",
  work: "trabalho/saída",
  exhaust: "exaustão",
} as const;

export function Canvas(props: CanvasProps) {
  const {
    circuit,
    runtime,
    solved,
    selectedId,
    pendingPort,
    onSelect,
    onMove,
    onPortClick,
    onSignalDown,
    onSignalUp,
    onActivate,
    blockedId,
    onDropComponent,
  } = props;
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);

  const startDrag = (event: PointerEvent, comp: PlacedComponent) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id: comp.id,
      dx: event.clientX - rect.left - comp.x,
      dy: event.clientY - rect.top - comp.y,
      moved: false,
    };
    onSelect(comp.id);
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const handleMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    drag.moved = true;
    onMove(
      drag.id,
      Math.max(0, snap(event.clientX - rect.left - drag.dx)),
      Math.max(0, snap(event.clientY - rect.top - drag.dy)),
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  /** clique curto (sem arrastar) aciona o componente na bancada */
  const handleGlyphClick = (comp: PlacedComponent) => {
    if (dragRef.current?.moved) return;
    onActivate(comp);
  };

  const portPosition = (componentId: string, portId: string) => {
    const comp = circuit.components.find((c) => c.id === componentId);
    if (!comp) return null;
    const port = CATALOG[comp.type].ports.find((p) => p.id === portId);
    if (!port) return null;
    return { x: comp.x + port.x, y: comp.y + port.y };
  };

  return (
    <div
      ref={areaRef}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClick={(event) => {
        if (event.target === areaRef.current) onSelect(null);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData("text/component");
        const rect = areaRef.current?.getBoundingClientRect();
        if (!type || !rect) return;
        onDropComponent(type, snap(event.clientX - rect.left - 60), snap(event.clientY - rect.top - 40));
      }}
      className="grid-plate relative h-full min-h-[560px] w-full overflow-auto bg-background"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {circuit.tubes.map((tube) => {
          const a = portPosition(tube.from.componentId, tube.from.portId);
          const b = portPosition(tube.to.componentId, tube.to.portId);
          if (!a || !b) return null;
          const charged =
            solved.pressurized.has(`${tube.from.componentId}:${tube.from.portId}`) ||
            solved.pressurized.has(`${tube.to.componentId}:${tube.to.portId}`);
          const mid = (a.x + b.x) / 2;
          const path = `M${a.x} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`;
          return (
            <g key={tube.id}>
              <path d={path} className="fill-none stroke-air-dim" strokeWidth={6} strokeLinecap="round" />
              <path
                d={path}
                className={cn("fill-none", charged ? "stroke-air" : "stroke-muted")}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={charged ? "10 8" : undefined}
              >
                {charged && (
                  <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.6s" repeatCount="indefinite" />
                )}
              </path>
            </g>
          );
        })}
      </svg>

      {circuit.components.map((comp) => {
        const def = CATALOG[comp.type];
        const isSignal = comp.type === "button";
        const sensorOn =
          comp.type === "sensor"
            ? comp.trigger === "retracted"
              ? (runtime.strokes[comp.targetId ?? ""] ?? 0) <= 0.02
              : (runtime.strokes[comp.targetId ?? ""] ?? 0) >= 0.98
            : false;
        return (
          <div
            key={comp.id}
            style={{ left: comp.x, top: comp.y, width: def.width }}
            className={cn(
              "absolute select-none rounded-md border bg-surface/80 p-0 shadow-lg backdrop-blur-[1px] transition-colors",
              selectedId === comp.id ? "border-primary" : "border-border",
              solved.actuated[comp.id] && "ring-2 ring-signal/70",
              blockedId === comp.id && "ring-2 ring-destructive animate-pulse",
            )}
          >
            <div
              onPointerDown={(event) => startDrag(event, comp)}
              onClick={() => handleGlyphClick(comp)}
              className="cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center justify-between border-b border-border/70 px-2 py-1">
                <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {comp.label}
                </span>
              </div>
              <div className="p-1">
                <ComponentGlyph
                  comp={comp}
                  stroke={runtime.strokes[comp.id] ?? 0}
                  actuated={!!solved.actuated[comp.id]}
                  signal={isSignal ? !!runtime.signals[comp.id] : sensorOn}
                  pressurizedPorts={solved.pressurized}
                />
              </div>
            </div>

            {isSignal && (
              <button
                type="button"
                onPointerDown={() => onSignalDown(comp)}
                onPointerUp={() => onSignalUp(comp)}
                onPointerLeave={() => onSignalUp(comp)}
                className="mb-1 w-[calc(100%-8px)] translate-x-1 rounded-sm bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground"
              >
                Acionar
              </button>
            )}

            {def.ports.map((port) => {
              const key = `${comp.id}:${port.id}`;
              const active = solved.pressurized.has(key);
              const pending =
                pendingPort?.componentId === comp.id && pendingPort.portId === port.id;
              return (
                <button
                  key={port.id}
                  type="button"
                  title={`Porta ${port.label} — ${PORT_ROLE[port.kind]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onPortClick(comp.id, port.id);
                  }}
                  style={{ left: port.x - 7, top: port.y + 21 }}
                  className={cn(
                    "absolute size-3.5 rounded-full border-2 transition-colors",
                    pending
                      ? "border-primary bg-primary"
                      : active
                        ? "border-air bg-air"
                        : "border-steel bg-background hover:border-primary",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] font-semibold text-muted-foreground",
                      port.y === 0 ? "top-3" : "bottom-3",
                    )}
                  >
                    {port.label}
                  </span>
                  <span className="sr-only">
                    Porta {port.label}, {PORT_ROLE[port.kind]}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
