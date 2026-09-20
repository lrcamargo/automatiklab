import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { CATALOG, portsForComponent } from "@/lib/pneumatics/catalog";
import { tubePath } from "@/lib/pneumatics/circuit";
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
  onMoveTube: (id: string, midY: number, midX: number) => void;
  blockedId: string | null;
  onDropComponent: (type: string, x: number, y: number) => void;
  /** Com a simulação rodando a bancada fica somente para operação. */
  editable: boolean;
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
    onMoveTube,
    blockedId,
    onDropComponent,
    editable,
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
  const tubeDragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const [panning, setPanning] = useState(false);

  /**
   * A margem antes da origem cresce junto com o componente mais à esquerda (ou
   * mais acima), para que coordenadas negativas continuem alcançáveis. Sem
   * isso a bancada parecia ter uma parede no lado esquerdo.
   */
  const origin = useMemo(() => {
    const minX = Math.min(
      0,
      ...circuit.components.map((comp) => comp.x),
      ...circuit.tubes.map((tube) => tube.midX ?? 0),
    );
    const minY = Math.min(
      0,
      ...circuit.components.map((comp) => comp.y),
      ...circuit.tubes.map((tube) => tube.midY ?? 0),
    );
    return {
      x: Math.max(WORLD_ORIGIN_X, -minX + 480),
      y: Math.max(WORLD_ORIGIN_Y, -minY + 240),
    };
  }, [circuit.components, circuit.tubes]);

  const worldSize = useMemo(
    () => ({
      width: Math.max(
        2400,
        ...circuit.components.map((comp) => origin.x + comp.x + CATALOG[comp.type].width + 720),
      ),
      height: Math.max(
        1400,
        ...circuit.components.map((comp) => origin.y + comp.y + CATALOG[comp.type].height + 420),
      ),
    }),
    [circuit.components, origin],
  );

  const prevOrigin = useRef(origin);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || area.dataset["panReady"]) return;
    area.scrollLeft = origin.x;
    area.scrollTop = origin.y;
    area.dataset["panReady"] = "true";
    prevOrigin.current = origin;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Ao crescer a margem, compensa o scroll para a bancada não "pular". */
  useLayoutEffect(() => {
    const area = areaRef.current;
    const previous = prevOrigin.current;
    if (area && (previous.x !== origin.x || previous.y !== origin.y)) {
      area.scrollLeft += origin.x - previous.x;
      area.scrollTop += origin.y - previous.y;
    }
    prevOrigin.current = origin;
  }, [origin]);

  const startDrag = (event: PointerEvent, comp: PlacedComponent) => {
    if (event.button !== 0 || !editable) return;
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
    const tubeDrag = tubeDragRef.current;
    const surface = surfaceRef.current?.getBoundingClientRect();
    if (tubeDrag && surface) {
      tubeDrag.moved = true;
      onMoveTube(
        tubeDrag.id,
        snap(event.clientY - surface.top - origin.y - tubeDrag.offsetY),
        snap(event.clientX - surface.left - origin.x - tubeDrag.offsetX),
      );
      return;
    }
    const drag = dragRef.current;
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    drag.moved = true;
    // coordenadas livres: a bancada cresce para os quatro lados
    onMove(
      drag.id,
      snap(event.clientX - rect.left - drag.dx),
      snap(event.clientY - rect.top - drag.dy),
    );
  };

  const movedRef = useRef(false);

  const endDrag = () => {
    if (panRef.current) {
      panRef.current = null;
      setPanning(false);
    }
    movedRef.current = !!dragRef.current?.moved || !!tubeDragRef.current?.moved;
    dragRef.current = null;
    tubeDragRef.current = null;
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
      if (!editable) return;
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
  }, [selectedId, selectedTubeId, onDeleteComponent, onDeleteTube, editable]);

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
      onMouseDown={(event) => {
        // impede o autoscroll nativo do botão do meio, que sequestra o arrasto
        if (event.button === 1) event.preventDefault();
      }}
      onWheel={(event) => {
        const area = areaRef.current;
        if (!area) return;
        // roda pura → rolagem horizontal da bancada; Shift/trackpad mantêm o eixo natural
        if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        area.scrollLeft += event.deltaY;
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
          snap(event.clientX - rect.left - origin.x - 60),
          snap(event.clientY - rect.top - origin.y - 40),
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
            left: origin.x,
            top: origin.y,
            width: worldSize.width - origin.x,
            height: worldSize.height - origin.y,
          }}
        >
          {/*
            O SVG precisa de um viewBox deslocado: sem ele o desenho começa em
            (0,0) e tudo que estiver em coordenada negativa é recortado — era a
            "parede" que cortava as mangueiras mas não os componentes, já que
            estes são divs absolutos e vazam para fora do container.
          */}
          <svg
            className="pointer-events-none absolute"
            style={{
              left: -origin.x,
              top: -origin.y,
              width: worldSize.width,
              height: worldSize.height,
            }}
            viewBox={`${-origin.x} ${-origin.y} ${worldSize.width} ${worldSize.height}`}
          >
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
              const middleY = tube.midY ?? a.y + (b.y - a.y) / 2;
              const path = tubePath(a, b, tube.midY, tube.midX);
              const isSelected = selectedTubeId === tube.id;
              return (
                <g key={tube.id}>
                  {/* faixa invisível e larga: alvo de clique confortável na linha */}
                  <path
                    d={path}
                    className={cn(
                      "pointer-events-auto fill-none stroke-transparent",
                      editable ? "cursor-move" : "cursor-pointer",
                    )}
                    strokeWidth={16}
                    strokeLinejoin="round"
                    onPointerDown={(event) => {
                      if (event.button !== 0 || !editable) return;
                      const surface = surfaceRef.current?.getBoundingClientRect();
                      if (!surface) return;
                      event.stopPropagation();
                      tubeDragRef.current = {
                        id: tube.id,
                        offsetY: event.clientY - surface.top - origin.y - middleY,
                        offsetX: event.clientX - surface.left - origin.x - (tube.midX ?? b.x),
                        moved: false,
                      };
                      (event.target as Element).setPointerCapture?.(event.pointerId);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (movedRef.current) return;
                      onSelectTube(tube.id);
                      onSelect(null);
                    }}
                  >
                    <title>
                      {editable
                        ? "Mangueira — clique para selecionar, arraste para reposicionar"
                        : "Mangueira — pare a simulação para editar"}
                    </title>
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

          {/* botão de remoção da mangueira selecionada, ancorado no cotovelo da linha */}
          {(() => {
            if (!editable) return null;
            const tube = circuit.tubes.find((item) => item.id === selectedTubeId);
            if (!tube) return null;
            const a = portPosition(tube.from.componentId, tube.from.portId);
            const b = portPosition(tube.to.componentId, tube.to.portId);
            if (!a || !b) return null;
            const midX = tube.midX ?? b.x;
            const midY = tube.midY ?? a.y + (b.y - a.y) / 2;
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
            const isSignal = comp.type === "valve32" || comp.type === "valve52";
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
                {selectedId === comp.id && editable && (
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
                  className={cn(
                    "size-full",
                    editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  )}
                >
                  <ComponentGlyph
                    comp={comp}
                    stroke={runtime.strokes[comp.id] ?? 0}
                    actuated={!!solved.actuated[comp.id]}
                    signal={isSignal ? !!runtime.signals[comp.id] : sensorOn}
                    pressurizedPorts={solved.pressurized}
                    count={runtime.counts?.[comp.id] ?? 0}
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
                      title={
                        editable
                          ? `Porta ${port.label} — ${PORT_ROLE[port.kind]}`
                          : "Pare a simulação para ligar mangueiras"
                      }
                      disabled={!editable}
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