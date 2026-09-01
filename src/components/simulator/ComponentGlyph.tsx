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
  const activeStroke = "stroke-air";
  const idleStroke = "stroke-steel";

  switch (comp.type) {
    case "source":
      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          <circle cx={34} cy={40} r={21} className="fill-none stroke-steel" strokeWidth={2} />
          <path d="M34 53 V27 M34 27 l-7 10 M34 27 l7 10" className="fill-none stroke-air" strokeWidth={2} />
          <path d="M55 40 H120" className="fill-none stroke-air" strokeWidth={2} />
          <text x={64} y={32} className="fill-foreground font-mono text-[11px]">
            6 bar
          </text>
          <text x={64} y={50} className="fill-muted-foreground font-mono text-[9px]">
            1 (P) PRESSÃO
          </text>
        </svg>
      );

    case "valve32":
    case "valve52": {
      const boxW = (def.width - 8) / 2;
      const positionClass = (positionActuated: boolean) =>
        positionActuated === actuated ? "fill-primary/25 stroke-primary" : "fill-surface-strong stroke-steel";

      if (comp.type === "valve32") {
        return (
          <svg width={def.width} height={def.height} className="overflow-visible">
            <text x={6} y={10} className="fill-muted-foreground font-mono text-[9px]">3/2 NF</text>
            <text x={70} y={9} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">2 (A)</text>
            <path d="M70 0 V26 M35 66 V92 M105 66 V92" className="fill-none stroke-steel" strokeWidth={1.5} />
            <text x={35} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">1 (P)</text>
            <text x={105} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">3 (R)</text>

            <rect x={4} y={26} width={boxW} height={40} className={positionClass(true)} strokeWidth={1.5} />
            <rect x={4 + boxW} y={26} width={boxW} height={40} className={positionClass(false)} strokeWidth={1.5} />

            {/* Acionada: alimentação 1 → trabalho 2; escape 3 bloqueado. */}
            <path d="M21 60 L55 32 M50 33 l6 -1 l-2 6" className={`fill-none ${actuated ? activeStroke : idleStroke}`} strokeWidth={2} />
            <path d="M64 58 V46 M58 46 H70" className="fill-none stroke-steel" strokeWidth={2} />
            {/* Repouso: trabalho 2 → escape 3; alimentação 1 bloqueada. */}
            <path d="M84 32 L119 60 M114 55 l5 5 l-7 0" className={`fill-none ${!actuated ? activeStroke : idleStroke}`} strokeWidth={2} />
            <path d="M78 58 V46 M72 46 H84" className="fill-none stroke-steel" strokeWidth={2} />
          </svg>
        );
      }

      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          <text x={6} y={10} className="fill-muted-foreground font-mono text-[9px]">5/2</text>
          <text x={45} y={9} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">2 (A)</text>
          <text x={125} y={9} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">4 (B)</text>
          <path d="M45 0 V26 M125 0 V26 M25 66 V92 M85 66 V92 M145 66 V92" className="fill-none stroke-steel" strokeWidth={1.5} />
          <text x={25} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">3 (R)</text>
          <text x={85} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">1 (P)</text>
          <text x={145} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">5 (S)</text>

          <rect x={4} y={26} width={boxW} height={40} className={positionClass(true)} strokeWidth={1.5} />
          <rect x={4 + boxW} y={26} width={boxW} height={40} className={positionClass(false)} strokeWidth={1.5} />
          {/* Acionada: 1 → 4 e 2 → 3. */}
          <path d="M43 60 L68 32 M63 33 l6 -1 l-2 6 M12 32 L35 60 M30 55 l5 5 l-7 0" className={`fill-none ${actuated ? activeStroke : idleStroke}`} strokeWidth={2} />
          {/* Repouso: 1 → 2 e 4 → 5. */}
          <path d="M108 60 L96 32 M92 37 l4 -5 l3 6 M135 32 L158 60 M153 55 l5 5 l-7 0" className={`fill-none ${!actuated ? activeStroke : idleStroke}`} strokeWidth={2} />
        </svg>
      );
    }

    case "cylinderSingle":
    case "cylinderDouble": {
      const bodyW = 150;
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
            width={Math.max(4, bodyW + 4 - pistonX)}
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
              d={`M${pistonX + 11} 52 l8 -18 l8 18 l8 -18 l8 18 l8 -18 l8 18`}
              className="fill-none stroke-muted-foreground"
              strokeWidth={1.5}
            />
          )}
          <text x={3} y={46} className="fill-muted-foreground font-mono text-[8px]">{comp.type === "cylinderSingle" ? "2 (A)" : "2/4"}</text>
          <text x={12} y={16} className="fill-muted-foreground font-mono text-[10px]">
            {Math.round(stroke * 100)}% curso
          </text>
        </svg>
      );
    }

    case "button":
      return (
        <svg width={def.width} height={def.height} className="overflow-visible">
          <path d="M48 18 V42" className={signal ? "stroke-signal" : "stroke-steel"} strokeWidth={2} />
          <path d="M34 18 H62 M38 12 H58" className="stroke-steel" strokeWidth={2} />
          <path d="M30 42 H66 V66 H30 Z" className={signal ? "fill-signal/25 stroke-signal" : "fill-none stroke-steel"} strokeWidth={2} />
          <path d="M38 58 L58 48" className="stroke-steel" strokeWidth={2} />
          <text
            x={def.width / 2}
            y={def.height - 12}
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
          <path d="M18 14 V34 M9 14 H27 M12 8 H24" className={signal ? "stroke-signal" : "stroke-steel"} strokeWidth={2} />
          <rect x={7} y={34} width={24} height={24} className={signal ? "fill-signal/25 stroke-signal" : "fill-none stroke-steel"} strokeWidth={2} />
          <path d="M12 52 L26 40" className="stroke-steel" strokeWidth={1.5} />
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
