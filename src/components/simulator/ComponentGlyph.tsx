import { CATALOG } from "@/lib/pneumatics/catalog";
import type { PlacedComponent } from "@/lib/pneumatics/types";

interface GlyphProps {
  comp: PlacedComponent;
  stroke: number;
  actuated: boolean;
  signal: boolean;
  pressurizedPorts: Set<string>;
}

/** Desenho esquemático de cada componente, com estado dinâmico. */
export function ComponentGlyph({ comp, stroke, actuated, signal, pressurizedPorts }: GlyphProps) {
  const def = CATALOG[comp.type];
  const live = (port: string) => pressurizedPorts.has(`${comp.id}:${port}`);

  switch (comp.type) {
    case "source":
      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          <rect
            x={1}
            y={1}
            width={def.width - 2}
            height={def.height - 2}
            rx={4}
            className="fill-surface-strong stroke-steel"
          />
          <circle cx={38} cy={40} r={17} className="fill-none stroke-steel" strokeWidth={2} />
          <path d="M38 24 L46 40 L30 40 Z" className="fill-primary" />
          <text x={64} y={36} className="fill-foreground font-mono text-[11px]">
            6 bar
          </text>
          <text x={64} y={52} className="fill-muted-foreground font-mono text-[10px]">
            ATIVA
          </text>
        </svg>
      );

    case "valve32":
    case "valve52": {
      const boxes = comp.type === "valve32" ? 2 : 2;
      const boxW = (def.width - 8) / boxes;
      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          {[0, 1].map((i) => (
            <rect
              key={i}
              x={4 + i * boxW}
              y={26}
              width={boxW}
              height={40}
              className={
                (actuated ? i === 0 : i === 1)
                  ? "fill-primary/25 stroke-primary"
                  : "fill-surface-strong stroke-steel"
              }
              strokeWidth={1.5}
            />
          ))}
          {/* setas indicando passagem */}
          <path
            d={`M${12 + (actuated ? 0 : boxW)} 58 L${boxW - 8 + (actuated ? 0 : boxW)} 34`}
            className="stroke-air"
            strokeWidth={2}
            markerEnd=""
          />
          <text x={6} y={20} className="fill-muted-foreground font-mono text-[10px]">
            {comp.type === "valve32" ? "3/2" : "5/2"}
          </text>
          <text x={def.width - 6} y={20} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
            {actuated ? "ACIONADA" : "REPOUSO"}
          </text>
        </svg>
      );
    }

    case "cylinderSingle":
    case "cylinderDouble": {
      const bodyW = 150;
      const rodTravel = 54;
      const pistonX = 16 + stroke * (bodyW - 46);
      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          <rect
            x={12}
            y={22}
            width={bodyW}
            height={40}
            rx={3}
            className="fill-surface-strong stroke-steel"
            strokeWidth={1.5}
          />
          {/* câmaras pressurizadas */}
          <rect
            x={13}
            y={23}
            width={Math.max(0, pistonX - 13)}
            height={38}
            className={live("A") ? "fill-air/35" : "fill-transparent"}
          />
          {comp.type === "cylinderDouble" && (
            <rect
              x={pistonX + 8}
              y={23}
              width={Math.max(0, bodyW + 12 - (pistonX + 9))}
              height={38}
              className={live("B") ? "fill-air/35" : "fill-transparent"}
            />
          )}
          <rect x={pistonX} y={23} width={8} height={38} className="fill-primary" />
          <rect
            x={pistonX + 8}
            y={38}
            width={bodyW + 4 - pistonX + rodTravel * 0}
            height={8}
            className="fill-steel"
          />
          <rect
            x={bodyW + 12}
            y={34}
            width={20 + stroke * 30}
            height={16}
            rx={2}
            className="fill-steel"
          />
          {comp.type === "cylinderSingle" && (
            <path
              d={`M${pistonX + 10} 42 h${Math.max(6, bodyW - pistonX)} `}
              className="stroke-muted-foreground"
              strokeDasharray="4 4"
            />
          )}
          <text x={12} y={16} className="fill-muted-foreground font-mono text-[10px]">
            {Math.round(stroke * 100)}% curso
          </text>
        </svg>
      );
    }

    case "button":
      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          <rect
            x={1}
            y={1}
            width={def.width - 2}
            height={def.height - 2}
            rx={6}
            className="fill-surface-strong stroke-steel"
          />
          <circle
            cx={def.width / 2}
            cy={def.height / 2 - 4}
            r={22}
            className={signal ? "fill-signal stroke-signal" : "fill-muted stroke-steel"}
            strokeWidth={2}
          />
          <text
            x={def.width / 2}
            y={def.height - 10}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            {comp.momentary ? "PULSO" : "TRAVA"}
          </text>
        </svg>
      );

    case "sensor":
      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          <rect
            x={1}
            y={1}
            width={def.width - 2}
            height={def.height - 2}
            rx={4}
            className="fill-surface-strong stroke-steel"
          />
          <circle
            cx={22}
            cy={def.height / 2}
            r={9}
            className={signal ? "fill-signal" : "fill-muted"}
          />
          <text x={40} y={32} className="fill-foreground font-mono text-[10px]">
            {comp.trigger === "retracted" ? "RECUADO" : "AVANÇADO"}
          </text>
          <text x={40} y={48} className="fill-muted-foreground font-mono text-[10px]">
            {signal ? "sinal on" : "sinal off"}
          </text>
        </svg>
      );

    default:
      return null;
  }
}
