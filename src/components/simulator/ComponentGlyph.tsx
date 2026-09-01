import { CATALOG } from "@/lib/pneumatics/catalog";
import type { PlacedComponent } from "@/lib/pneumatics/types";

interface GlyphProps {
  comp: PlacedComponent;
  stroke: number;
  actuated: boolean;
  signal: boolean;
  pressurizedPorts: Set<string>;
}

const line = "fill-none stroke-steel";

/** Símbolos esquemáticos baseados na ISO 1219, com estado dinâmico. */
export function ComponentGlyph({ comp, stroke, actuated, signal, pressurizedPorts }: GlyphProps) {
  const def = CATALOG[comp.type];
  const live = (port: string) => pressurizedPorts.has(`${comp.id}:${port}`);
  const flow = (active: boolean) => `fill-none ${active ? "stroke-air" : "stroke-steel"}`;
  const position = (active: boolean) =>
    active ? "fill-primary/25 stroke-primary" : "fill-surface-strong stroke-steel";

  switch (comp.type) {
    case "source":
      return (
        <svg width={def.width} height={def.height} viewBox="0 0 120 80" className="overflow-visible" aria-label="Fonte de ar comprimido">
          <circle cx={38} cy={40} r={22} className={line} strokeWidth={2} />
          {/* Triângulo aberto: energia pneumática, com sentido para a saída. */}
          <path d="M28 31 L50 40 L28 49 Z" className="fill-background stroke-air" strokeWidth={2} />
          <path d="M60 40 H120" className="fill-none stroke-air" strokeWidth={2} />
          <text x={68} y={31} className="fill-foreground font-mono text-[10px]">6 bar</text>
          <text x={68} y={53} className="fill-muted-foreground font-mono text-[8px]">1</text>
        </svg>
      );

    case "valve32":
      return (
        <svg width={def.width} height={def.height} viewBox="0 0 140 92" className="overflow-visible" aria-label="Válvula direcional 3 por 2, normalmente fechada">
          {/* Duas posições; a posição junto à mola (direita) é o repouso. */}
          <rect x={20} y={24} width={50} height={44} className={position(actuated)} strokeWidth={1.5} />
          <rect x={70} y={24} width={50} height={44} className={position(!actuated)} strokeWidth={1.5} />

          {/* Acionada: 1 → 2; porta 3 bloqueada. */}
          <path d="M34 62 L56 30 M51 32 l6 -2 l-1 6" className={flow(actuated)} strokeWidth={2} />
          <path d="M63 61 V50 M57 50 H69" className={line} strokeWidth={2} />
          {/* Repouso: 2 → 3; porta 1 bloqueada. */}
          <path d="M84 30 L106 62 M101 57 l5 5 l-7 0" className={flow(!actuated)} strokeWidth={2} />
          <path d="M77 61 V50 M71 50 H83" className={line} strokeWidth={2} />

          {/* Conexões externas na posição normal. */}
          <path d="M95 0 V24 M82 68 V92 M108 68 V92" className={line} strokeWidth={1.5} />
          <text x={95} y={9} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">2</text>
          <text x={82} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">1</text>
          <text x={108} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">3</text>

          {/* Solenoide à esquerda e retorno por mola à direita. */}
          <rect x={4} y={32} width={16} height={28} className={line} strokeWidth={1.5} />
          <path d="M6 58 L18 34" className={actuated ? "stroke-signal" : "stroke-steel"} strokeWidth={1.5} />
          <path d="M120 46 h4 l3 -9 l5 18 l5 -18" className={line} strokeWidth={1.5} />
          <text x={4} y={10} className="fill-muted-foreground font-mono text-[8px]">3/2 NF</text>
        </svg>
      );

    case "valve52":
      return (
        <svg width={def.width} height={def.height} viewBox="0 0 170 92" className="overflow-visible" aria-label="Válvula direcional 5 por 2 com retorno por mola">
          <rect x={20} y={24} width={65} height={44} className={position(actuated)} strokeWidth={1.5} />
          <rect x={85} y={24} width={65} height={44} className={position(!actuated)} strokeWidth={1.5} />

          {/* Acionada: 1 → 4 e 2 → 3. */}
          <path d="M48 62 L69 30 M64 32 l6 -2 l-1 6 M29 30 L42 62 M37 57 l5 5 l-7 0" className={flow(actuated)} strokeWidth={2} />
          {/* Repouso: 1 → 2 e 4 → 5. */}
          <path d="M112 62 L101 30 M97 35 l4 -5 l3 6 M126 30 L142 62 M137 57 l5 5 l-7 0" className={flow(!actuated)} strokeWidth={2} />

          {/* Cinco vias, mostradas somente uma vez na posição normal. */}
          <path d="M101 0 V24 M134 0 V24 M96 68 V92 M117 68 V92 M140 68 V92" className={line} strokeWidth={1.5} />
          <text x={101} y={9} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">2</text>
          <text x={134} y={9} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">4</text>
          <text x={96} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">3</text>
          <text x={117} y={79} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">1</text>
          <text x={140} y={90} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">5</text>

          <rect x={4} y={32} width={16} height={28} className={line} strokeWidth={1.5} />
          <path d="M6 58 L18 34" className={actuated ? "stroke-signal" : "stroke-steel"} strokeWidth={1.5} />
          <path d="M150 46 h4 l3 -9 l5 18 l5 -18" className={line} strokeWidth={1.5} />
          <text x={4} y={10} className="fill-muted-foreground font-mono text-[8px]">5/2</text>
        </svg>
      );

    case "cylinderSingle":
    case "cylinderDouble": {
      const bodyX = 24;
      const bodyY = 20;
      const bodyW = 144;
      const bodyH = 44;
      const pistonX = bodyX + 14 + stroke * (bodyW - 42);
      const rodEnd = 216;
      const springRoom = Math.max(8, bodyX + bodyW - pistonX - 8);
      return (
        <svg width={def.width} height={def.height} viewBox="0 0 220 84" className="overflow-visible" aria-label={`Cilindro de ${comp.type === "cylinderSingle" ? "simples" : "dupla"} ação`}>
          <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} className="fill-surface-strong stroke-steel" strokeWidth={1.5} />
          <rect x={bodyX + 1} y={bodyY + 1} width={Math.max(0, pistonX - bodyX - 1)} height={bodyH - 2} className={live("A") ? "fill-air/35" : "fill-transparent"} />
          {comp.type === "cylinderDouble" && (
            <rect x={pistonX + 2} y={bodyY + 1} width={Math.max(0, bodyX + bodyW - pistonX - 3)} height={bodyH - 2} className={live("B") ? "fill-air/35" : "fill-transparent"} />
          )}
          {/* Êmbolo e haste conforme o símbolo de cilindro. */}
          <path d={`M${pistonX} ${bodyY} V${bodyY + bodyH}`} className="stroke-primary" strokeWidth={4} />
          <path d={`M${pistonX + 2} ${bodyY + bodyH / 2} H${rodEnd}`} className="stroke-steel" strokeWidth={5} />
          {comp.type === "cylinderSingle" && (
            <path
              d={`M${pistonX + 4} 53 l${springRoom / 6} -18 l${springRoom / 6} 18 l${springRoom / 6} -18 l${springRoom / 6} 18 l${springRoom / 6} -18 l${springRoom / 6} 18`}
              className="fill-none stroke-muted-foreground"
              strokeWidth={1.5}
            />
          )}
          {/* Portas nas câmaras correspondentes. */}
          <path d="M34 64 V84" className={flow(live("A"))} strokeWidth={1.5} />
          {comp.type === "cylinderDouble" && <path d="M148 64 V84" className={flow(live("B"))} strokeWidth={1.5} />}
          <text x={34} y={79} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">2</text>
          {comp.type === "cylinderDouble" && <text x={148} y={79} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">4</text>}
          <text x={24} y={14} className="fill-muted-foreground font-mono text-[9px]">{Math.round(stroke * 100)}% curso</text>
        </svg>
      );
    }

    case "button":
      return (
        <svg width={def.width} height={def.height} viewBox="0 0 96 96" className="overflow-visible" aria-label="Botão de comando manual">
          {/* Acionamento manual por botão, sem portas pneumáticas próprias. */}
          <path d="M48 10 V29 M34 10 H62 M38 5 H58" className={signal ? "stroke-signal" : "stroke-steel"} strokeWidth={2} />
          <rect x={28} y={29} width={40} height={38} className={signal ? "fill-signal/25 stroke-signal" : "fill-none stroke-steel"} strokeWidth={1.5} />
          <path d="M36 58 L60 38" className="stroke-steel" strokeWidth={2} />
          <circle cx={36} cy={58} r={2} className="fill-steel" />
          <circle cx={60} cy={58} r={2} className="fill-steel" />
          <text x={48} y={84} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">{comp.momentary ? "PULSO" : "TRAVA"}</text>
        </svg>
      );

    case "sensor":
      return (
        <svg width={def.width} height={def.height} viewBox="0 0 110 76" className="overflow-visible" aria-label="Sensor mecânico de fim de curso">
          {/* Acionamento mecânico por rolete e contato de fim de curso. */}
          <circle cx={20} cy={10} r={6} className={signal ? "fill-signal/25 stroke-signal" : "fill-none stroke-steel"} strokeWidth={1.5} />
          <path d="M24 15 L31 30" className={signal ? "stroke-signal" : "stroke-steel"} strokeWidth={2} />
          <rect x={8} y={30} width={30} height={30} className={signal ? "fill-signal/25 stroke-signal" : "fill-none stroke-steel"} strokeWidth={1.5} />
          <path d="M14 53 L32 38" className="stroke-steel" strokeWidth={1.5} />
          <text x={45} y={35} className="fill-foreground font-mono text-[9px]">{comp.trigger === "retracted" ? "RECUADO" : "AVANÇADO"}</text>
          <text x={45} y={50} className="fill-muted-foreground font-mono text-[9px]">{signal ? "sinal on" : "sinal off"}</text>
        </svg>
      );

    default:
      return null;
  }
}