import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { CATALOG, portsForComponent } from "@/lib/pneumatics/catalog";
import type { Circuit, PlacedComponent, RuntimeState, SolveResult } from "@/lib/pneumatics/types";
import { ComponentGlyph } from "./ComponentGlyph";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasProps {
  circuit: Circuit;
  runtime: RuntimeState;
  solved: SolveResult;
  selectedId: string | null;
  selectedTubeId: string | null;
  pendingPort: { componentId: string; portId: string } | null;
  onSelect: (id: string | null) => void;
  onSelectTube: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onPortClick: (componentId: string, portId: string) => void;
  onActivate: (comp: PlacedComponent) => void;
  onDeleteComponent: (id: string) => void;
  onDeleteTube: (id: string) => void;
  blockedId: string | null;
  onDropComponent: (type: string, x: number, y: number) => void;
}

const GRID = 24;
const WORLD_ORIGIN_X = 720;
const WORLD_ORIGIN_Y = 360;
const snap = (value: number) => Math.round(value / GRID) * GRID;
const PORT_ROLE = {
  supply: "alimentação/pressão",
  work: "trabalho/saída",
  exhaust: "exaustão",
  control: "pilotagem pneumática",
} as const;

export function Canvas(props: CanvasProps) {
  const {
    circuit,
    runtime,
    solved,
    selectedId,
    selectedTubeId,
    pendingPort,
    onSelect,
    onSelectTube,
    onMove,
    onPortClick,
    onActivate,
    onDeleteComponent,
    onDeleteTube,
    blockedId,
    onDropComponent,
  } = props;
  const areaRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const panRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [panning, setPanning] = useState(false);
  const worldSize = useMemo(
    () => ({
      width: Math.max(
        2400,
        ...circuit.components.map(
          (comp) => WORLD_ORIGIN_X + comp.x + CATALOG[comp.type].width + 720,
        ),
      ),
      height: Math.max(
        1400,
        ...circuit.components.map(
          (comp) => WORLD_ORIGIN_Y + comp.y + CATALOG[comp.type].height + 420,
        ),
      ),
    }),
    [circuit.components],
  );

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || area.dataset["panReady"]) return;
    area.scrollLeft = WORLD_ORIGIN_X;
    area.scrollTop = WORLD_ORIGIN_Y;
    area.dataset["panReady"] = "true";
  }, []);

  const startDrag = (event: PointerEvent, comp: PlacedComponent) => {
    if (event.button !== 0) return;
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id: comp.id,
      dx: event.clientX - rect.left - comp.x,
      dy: event.clientY - rect.top - comp.y,
      moved: false,
    };
    onSelect(comp.id);
    onSelectTube(null);
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const handleMove = (event: PointerEvent) => {
    const area = areaRef.current;
    const pan = panRef.current;
    if (area && pan) {
      area.scrollLeft = pan.left - (event.clientX - pan.x);
      area.scrollTop = pan.top - (event.clientY - pan.y);
      return;
    }
    const drag = dragRef.current;
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    drag.moved = true;
    onMove(
      drag.id,
      Math.max(0, snap(event.clientX - rect.left - drag.dx)),
      Math.max(0, snap(event.clientY - rect.top - drag.dy)),
    );
  };

  const movedRef = useRef(false);

  const endDrag = () => {
    if (panRef.current) {
      panRef.current = null;
      setPanning(false);
    }
    movedRef.current = !!dragRef.current?.moved;
    dragRef.current = null;
  };

  /** clique curto (sem arrastar) aciona o componente na bancada */
  const handleGlyphClick = (comp: PlacedComponent) => {
    if (movedRef.current || dragRef.current?.moved) return;
    onActivate(comp);
  };

  /** Delete/Backspace remove o que estiver selecionado, exceto ao digitar num campo. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }
      if (selectedTubeId) {
        event.preventDefault();
        onDeleteTube(selectedTubeId);
      } else if (selectedId) {
        event.preventDefault();
        onDeleteComponent(selectedId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, selectedTubeId, onDeleteComponent, onDeleteTube]);

  const portPosition = (componentId: string, portId: string) => {
    const comp = circuit.components.find((c) => c.id === componentId);
    if (!comp) return null;
    const port = portsForComponent(comp).find((item) => item.id === portId);
    if (!port) return null;
    return { x: comp.x + port.x, y: comp.y + port.y };
  };

  return (
    <div
      ref={areaRef}
      onPointerDown={(event) => {
        if (event.button !== 1 || !areaRef.current) return;
        event.preventDefault();
        panRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          left: areaRef.current.scrollLeft,
          top: areaRef.current.scrollTop,
        };
        setPanning(true);
        areaRef.current.setPointerCapture(event.pointerId);
      }}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onAuxClick={(event) => event.preventDefault()}
      onClick={(event) => {
        if (event.target === areaRef.current || event.target === surfaceRef.current) {
          onSelect(null);
          onSelectTube(null);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData("text/component");
        const rect = surfaceRef.current?.getBoundingClientRect();
        if (!type || !rect) return;
        onDropComponent(
          type,
          snap(event.clientX - rect.left - WORLD_ORIGIN_X - 60),
          snap(event.clientY - rect.top - WORLD_ORIGIN_Y - 40),
        );
      }}
      className={cn(
        "relative h-full min-h-[560px] w-full overflow-auto bg-background",
        panning && "cursor-grabbing select-none",
      )}
    >
      <div
        ref={surfaceRef}
        className="grid-plate relative"
        style={{ width: worldSize.width, height: worldSize.height }}
      >
        <div
          className="absolute"
          style={{
            left: WORLD_ORIGIN_X,
            top: WORLD_ORIGIN_Y,
            width: worldSize.width - WORLD_ORIGIN_X,
            height: worldSize.height - WORLD_ORIGIN_Y,
          }}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {circuit.tubes.map((tube) => {
              const a = portPosition(tube.from.componentId, tube.from.portId);
              const b = portPosition(tube.to.componentId, tube.to.portId);
              if (!a || !b) return null;
              const charged =
                solved.pressurized.has(`${tube.from.componentId}:${tube.from.portId}`) ||
                solved.pressurized.has(`${tube.to.componentId}:${tube.to.portId}`);
              const conflicted =
                solved.conflicts.has(`${tube.from.componentId}:${tube.from.portId}`) ||
                solved.conflicts.has(`${tube.to.componentId}:${tube.to.portId}`);
              const middleY = a.y + (b.y - a.y) / 2;
              const path = `M${a.x} ${a.y} V${middleY} H${b.x} V${b.y}`;
              const isSelected = selectedTubeId === tube.id;
              return (
                <g key={tube.id}>
                  <defs>
                    <marker
                      id={`flow-${tube.id}`}
                      markerWidth="7"
                      markerHeight="7"
                      refX="6"
                      refY="3.5"
                      orient="auto"
                    >
                      <path d="M0 0 L7 3.5 L0 7 Z" className="fill-air" />
                    </marker>
                  </defs>
                   {/* faixa invisível e larga: alvo de clique confortável na linha */}
                  <path
                    d={path}
                    className="pointer-events-auto cursor-pointer fill-none stroke-transparent"
                    strokeWidth={16}
                    strokeLinejoin="round"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectTube(tube.id);
                      onSelect(null);
                    }}
                  >
                    <title>Mangueira — clique para selecionar e remover</title>
                  </path>
                  {isSelected && (
                    <path
                      d={path}
                      className="pointer-events-none fill-none stroke-primary"
                      strokeWidth={9}
                      strokeLinejoin="round"
                      opacity={0.35}
                    />
                  )}
                  <path
                    d={path}
                    className="pointer-events-none fill-none stroke-air-dim"
                    strokeWidth={5}
                    strokeLinejoin="round"
                  />
                  <path
                    d={path}
                    className={cn(
                      "pointer-events-none fill-none",
                      conflicted ? "stroke-destructive" : charged ? "stroke-air" : "stroke-muted",
                    )}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeDasharray={charged && !conflicted ? "10 8" : undefined}
                    markerEnd={charged && !conflicted ? `url(#flow-${tube.id})` : undefined}
                  >
                    {charged && !conflicted && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="18"
                        to="0"
                        dur="0.6s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                </g>
              );
            })}
          </svg>

          {(() => {
            const tube = circuit.tubes.find((item) => item.id === selectedTubeId);
            if (!tube) return null;
            const a = portPosition(tube.from.componentId, tube.from.portId);
            const b = portPosition(tube.to.componentId, tube.to.portId);
            if (!a || !b) return null;
            const midX = b.x;
            const midY = a.y + (b.y - a.y) / 2;
            return (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteTube(tube.id);
                }}
                title="Remover esta mangueira (Delete)"
                aria-label="Remover esta mangueira"
                style={{ left: midX - 11, top: midY - 11 }}
                className="absolute z-10 flex size-[22px] items-center justify-center rounded-full border border-destructive bg-background text-destructive shadow-sm transition-colors hover:bg-destructive hover:text-background"
              >
                <X className="size-3.5" />
              </button>
            );
          })()}
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
                style={{ left: comp.x, top: comp.y, width: def.width, height: def.height }}
                className={cn(
                  "group absolute select-none transition-[filter]",
                  selectedId === comp.id && "drop-shadow-[0_0_6px_var(--color-primary)]",
                  solved.actuated[comp.id] && "drop-shadow-[0_0_7px_var(--color-signal)]",
                  blockedId === comp.id &&
                    "animate-pulse drop-shadow-[0_0_8px_var(--color-destructive)]",
                )}
              >
                {selectedId === comp.id && (
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteComponent(comp.id);
                    }}
                    title={`Remover ${comp.label} (Delete)`}
                    aria-label={`Remover ${comp.label}`}
                    className="absolute -right-2 -top-2 z-10 flex size-[22px] items-center justify-center rounded-full border border-destructive bg-background text-destructive shadow-sm transition-colors hover:bg-destructive hover:text-background"
                  >
                    <X className="size-3.5" />
                  </button>
                )}

                <div
                  onPointerDown={(event) => startDrag(event, comp)}
                  onClick={() => handleGlyphClick(comp)}
                  className="size-full cursor-grab active:cursor-grabbing"
                >
                  <ComponentGlyph
                    comp={comp}
                    stroke={runtime.strokes[comp.id] ?? 0}
                    actuated={!!solved.actuated[comp.id]}
                    signal={isSignal ? !!runtime.signals[comp.id] : sensorOn}
                    pressurizedPorts={solved.pressurized}
                  />
                </div>

                {portsForComponent(comp).map((port) => {
                  const key = `${comp.id}:${port.id}`;
                  const active = solved.pressurized.has(key);
                  const conflicted = solved.conflicts.has(key);
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
                      aria-label={`Porta ${port.label}, ${PORT_ROLE[port.kind]}`}
                      style={{ left: port.x - 7, top: port.y - 7 }}
                      className={cn(
                        "absolute size-3.5 rounded-full border-2 transition-colors opacity-75 hover:opacity-100",
                        pending
                          ? "border-primary bg-primary"
                          : conflicted
                            ? "border-destructive bg-destructive"
                            : active
                              ? "border-air bg-air"
                              : "border-steel bg-background hover:border-primary",
                      )}
                    ></button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
