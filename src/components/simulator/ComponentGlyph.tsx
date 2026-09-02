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

/** Símbolos esquemáticos conforme ISO 1219, com estado dinâmico. */
export function ComponentGlyph({ comp, stroke, actuated, signal, pressurizedPorts }: GlyphProps) {
  const def = CATALOG[comp.type];
  const live = (port: string) => pressurizedPorts.has(`${comp.id}:${port}`);
  const flow = (active: boolean) => `fill-none ${active ? "stroke-air" : "stroke-steel"}`;
  const box = (active: boolean) =>
    active ? "fill-primary/20 stroke-primary" : "fill-surface-strong stroke-steel";

  /** traço de via bloqueada (T) usado dentro dos quadrados de posição */
  const Blocked = ({ x, from, to }: { x: number; from: number; to: number }) => (
    <path d={`M${x} ${from} V${to} M${x - 6} ${to} H${x + 6}`} className={line} strokeWidth={2} />
  );

  /** triângulo de exaustão para a atmosfera */
  const Exhaust = ({ x, y }: { x: number; y: number }) => (
    <path d={`M${x - 5} ${y + 8} L${x + 5} ${y + 8} L${x} ${y} Z`} className={line} strokeWidth={1.5} />
  );

  switch (comp.type) {
    case "source":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox="0 0 120 80"
          className="overflow-visible"
          aria-label="Fonte de ar comprimido"
        >
          {/* Unidade de alimentação: círculo com triângulo cheio (energia pneumática). */}
          <circle cx={38} cy={40} r={20} className={line} strokeWidth={2} />
          <path d="M30 30 L52 40 L30 50 Z" className="fill-air stroke-air" strokeWidth={1.5} />
          <path d="M58 40 H120" className="fill-none stroke-air" strokeWidth={2} />
          <path d="M92 40 v-8" className={line} strokeWidth={1.5} />
          <text x={66} y={26} className="fill-foreground font-mono text-[10px]">
            6 bar
          </text>
          <text x={12} y={74} className="fill-muted-foreground font-mono text-[8px]">
            alimentação
          </text>
        </svg>
      );

    case "valve32":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox="0 0 140 92"
          className="overflow-visible"
          aria-label="Válvula direcional 3/2 normalmente fechada"
        >
          {/* Dois quadrados de posição: esquerda = acionada, direita = repouso (mola). */}
          <rect x={20} y={24} width={50} height={44} className={box(actuated)} strokeWidth={1.5} />
          <rect x={70} y={24} width={50} height={44} className={box(!actuated)} strokeWidth={1.5} />

          {/* Posição acionada: 1 → 2, via 3 bloqueada. */}
          <path
            d="M32 68 V56 C32 44 45 44 45 34 M41 40 l4 -7 l4 7"
            className={flow(actuated)}
            strokeWidth={2}
          />
          <Blocked x={58} from={68} to={54} />

          {/* Posição de repouso: 2 → 3, via 1 bloqueada. */}
          <path
            d="M95 24 V38 C95 50 108 50 108 62 M104 56 l4 8 l4 -8"
            className={flow(!actuated)}
            strokeWidth={2}
          />
          <Blocked x={82} from={68} to={54} />

          {/* Conexões externas na posição de repouso. */}
          <path d="M95 8 V24 M82 68 V84 M108 68 V80" className={line} strokeWidth={1.5} />
          <Exhaust x={108} y={80} />

          {/* Acionamento por botão/piloto à esquerda e retorno por mola à direita. */}
          <rect x={2} y={34} width={18} height={24} className={line} strokeWidth={1.5} />
          <path
            d="M4 56 L18 36"
            className={actuated ? "stroke-signal" : "stroke-steel"}
            strokeWidth={1.5}
          />
          <path d="M120 46 H124 M124 40 l4 12 l4 -12 l4 12 l4 -12 v12" className={line} strokeWidth={1.5} />
          <text x={2} y={18} className="fill-muted-foreground font-mono text-[8px]">
            3/2 NF
          </text>
        </svg>
      );

    case "valve52":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox="0 0 170 92"
          className="overflow-visible"
          aria-label="Válvula direcional 5/2 com retorno por mola"
        >
          <rect x={20} y={24} width={65} height={44} className={box(actuated)} strokeWidth={1.5} />
          <rect x={85} y={24} width={65} height={44} className={box(!actuated)} strokeWidth={1.5} />

          {/* Posição acionada: 1 → 4 e 2 → 3; via 5 bloqueada. */}
          <path
            d="M52 68 V54 C52 42 69 44 69 34 M65 40 l4 -7 l4 7"
            className={flow(actuated)}
            strokeWidth={2}
          />
          <path
            d="M36 24 V38 C36 50 31 50 31 62 M27 56 l4 8 l4 -8"
            className={flow(actuated)}
            strokeWidth={2}
          />
          <Blocked x={75} from={68} to={54} />

          {/* Posição de repouso: 1 → 2 e 4 → 5; via 3 bloqueada. */}
          <path
            d="M117 68 V54 C117 42 101 44 101 34 M97 40 l4 -7 l4 7"
            className={flow(!actuated)}
            strokeWidth={2}
          />
          <path
            d="M134 24 V38 C134 50 140 50 140 62 M136 56 l4 8 l4 -8"
            className={flow(!actuated)}
            strokeWidth={2}
          />
          <Blocked x={96} from={68} to={54} />

          {/* Cinco vias, indicadas na posição de repouso. */}
          <path
            d="M101 8 V24 M134 8 V24 M96 68 V80 M117 68 V84 M140 68 V80"
            className={line}
            strokeWidth={1.5}
          />
          <Exhaust x={96} y={80} />
          <Exhaust x={140} y={80} />

          <rect x={2} y={34} width={18} height={24} className={line} strokeWidth={1.5} />
          <path
            d="M4 56 L18 36"
            className={actuated ? "stroke-signal" : "stroke-steel"}
            strokeWidth={1.5}
          />
          <path d="M150 46 H154 M154 40 l4 12 l4 -12 l4 12 l4 -12 v12" className={line} strokeWidth={1.5} />
          <text x={2} y={18} className="fill-muted-foreground font-mono text-[8px]">
            5/2
          </text>
        </svg>
      );

    case "cylinderSingle":
    case "cylinderDouble": {
      const bodyX = 24;
      const bodyY = 18;
      const bodyW = 144;
      const bodyH = 46;
      const pistonX = bodyX + 16 + stroke * (bodyW - 48);
      const rodEnd = 214;
      const springRoom = Math.max(12, bodyX + bodyW - pistonX - 10);
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox="0 0 220 84"
          className="overflow-visible"
          aria-label={`Cilindro de ${comp.type === "cylinderSingle" ? "simples" : "dupla"} ação`}
        >
          {/* Camisa do cilindro, fechada nas duas extremidades. */}
          <rect
            x={bodyX}
            y={bodyY}
            width={bodyW}
            height={bodyH}
            className="fill-surface-strong stroke-steel"
            strokeWidth={2}
          />
          <rect
            x={bodyX + 2}
            y={bodyY + 2}
            width={Math.max(0, pistonX - bodyX - 2)}
            height={bodyH - 4}
            className={live("A") ? "fill-air/35" : "fill-transparent"}
          />
          {comp.type === "cylinderDouble" && (
            <rect
              x={pistonX + 3}
              y={bodyY + 2}
              width={Math.max(0, bodyX + bodyW - pistonX - 5)}
              height={bodyH - 4}
              className={live("B") ? "fill-air/35" : "fill-transparent"}
            />
          )}

          {/* Êmbolo e haste passante pela tampa dianteira. */}
          <path d={`M${pistonX} ${bodyY} V${bodyY + bodyH}`} className="stroke-primary" strokeWidth={5} />
          <path
            d={`M${pistonX + 2} ${bodyY + bodyH / 2} H${rodEnd}`}
            className="stroke-steel"
            strokeWidth={5}
          />
          <path d={`M${rodEnd} ${bodyY + 6} V${bodyY + bodyH - 6}`} className="stroke-steel" strokeWidth={4} />

          {comp.type === "cylinderSingle" && (
            <path
              d={`M${pistonX + 5} ${bodyY + bodyH - 6} ${Array.from({ length: 6 })
                .map((_, i) => `l${springRoom / 6} ${i % 2 === 0 ? -(bodyH - 14) : bodyH - 14}`)
                .join(" ")}`}
              className="fill-none stroke-muted-foreground"
              strokeWidth={1.5}
            />
          )}

          {/* Portas de trabalho na base, alinhadas às respectivas câmaras. */}
          <path d="M34 64 V82" className={flow(live("A"))} strokeWidth={2} />
          {comp.type === "cylinderDouble" && (
            <path d="M148 64 V82" className={flow(live("B"))} strokeWidth={2} />
          )}
          <text x={24} y={12} className="fill-muted-foreground font-mono text-[9px]">
            {Math.round(stroke * 100)}% curso
          </text>
        </svg>
      );
    }

    case "button":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox="0 0 96 96"
          className="overflow-visible"
          aria-label="Válvula 3/2 de acionamento manual por botão"
        >
          {/* Válvula direcional 3/2 de comando manual, com retorno por mola. */}
          <rect x={20} y={30} width={28} height={34} className={signal ? "fill-primary/20 stroke-primary" : "fill-surface-strong stroke-steel"} strokeWidth={1.5} />
          <rect x={48} y={30} width={28} height={34} className={signal ? "fill-surface-strong stroke-steel" : "fill-primary/20 stroke-primary"} strokeWidth={1.5} />

          {/* Acionada: 1 → 2. Repouso: 2 → 3. */}
          <path d="M28 64 V52 C28 44 40 44 40 36 M37 41 l3 -6 l3 6" className={signal ? "fill-none stroke-signal" : "fill-none stroke-steel"} strokeWidth={1.8} />
          <path d="M62 30 V42 C62 50 68 50 68 60 M65 55 l3 6 l3 -6" className={line} strokeWidth={1.8} />
          <path d="M56 64 V54 M51 54 H61" className={line} strokeWidth={1.8} />

          <path d="M62 18 V30 M56 64 V72 M68 64 V70" className={line} strokeWidth={1.5} />
          <path d="M63 70 L73 70 L68 62 Z" className={line} strokeWidth={1.2} />

          {/* Botão manual à esquerda, mola à direita. */}
          <path
            d="M34 8 V18 M24 8 H44"
            className={signal ? "stroke-signal" : "stroke-steel"}
            strokeWidth={2}
          />
          <rect x={6} y={36} width={14} height={22} className={signal ? "fill-signal/25 stroke-signal" : "fill-none stroke-steel"} strokeWidth={1.5} />
          <path d="M8 47 h4 M12 41 v12" className={signal ? "stroke-signal" : "stroke-steel"} strokeWidth={1.5} />
          <path d="M76 47 h3 M79 42 l3 10 l3 -10 l3 10 v-10" className={line} strokeWidth={1.5} />
          <text x={20} y={88} className="fill-muted-foreground font-mono text-[9px]">
            3/2 {comp.momentary ? "pulso" : "trava"}
          </text>
        </svg>
      );

    case "sensor":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox="0 0 110 76"
          className="overflow-visible"
          aria-label="Válvula 3/2 de fim de curso com acionamento por rolete"
        >
          {/* Rolete mecânico. */}
          <circle
            cx={12}
            cy={12}
            r={6}
            className={signal ? "fill-signal/30 stroke-signal" : "fill-none stroke-steel"}
            strokeWidth={1.5}
          />
          <path d="M12 18 V30" className={signal ? "stroke-signal" : "stroke-steel"} strokeWidth={2} />
          <rect x={4} y={30} width={14} height={20} className={line} strokeWidth={1.5} />

          {/* Quadrados de posição da 3/2 de fim de curso. */}
          <rect x={18} y={30} width={24} height={20} className={signal ? "fill-primary/20 stroke-primary" : "fill-surface-strong stroke-steel"} strokeWidth={1.5} />
          <rect x={42} y={30} width={24} height={20} className={signal ? "fill-surface-strong stroke-steel" : "fill-primary/20 stroke-primary"} strokeWidth={1.5} />
          <path d="M24 50 V42 C24 37 34 37 34 32 M31 36 l3 -5 l3 5" className={signal ? "fill-none stroke-signal" : "fill-none stroke-steel"} strokeWidth={1.5} />
          <path d="M54 30 V38 C54 43 60 43 60 48 M57 44 l3 5 l3 -5" className={line} strokeWidth={1.5} />
          <path d="M50 50 V44 M46 44 H54" className={line} strokeWidth={1.5} />
          <path d="M66 40 h3 M69 35 l3 10 l3 -10 l3 10 v-10" className={line} strokeWidth={1.5} />

          <text x={4} y={66} className="fill-foreground font-mono text-[9px]">
            {comp.trigger === "retracted" ? "recuado" : "avançado"}
          </text>
          <text x={62} y={66} className="fill-muted-foreground font-mono text-[9px]">
            {signal ? "sinal on" : "sinal off"}
          </text>
        </svg>
      );

    default:
      return null;
  }
}
