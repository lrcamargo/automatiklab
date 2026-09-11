import { CATALOG } from "@/lib/pneumatics/catalog";
import type { ActuationType, PlacedComponent } from "@/lib/pneumatics/types";

interface GlyphProps {
  comp: PlacedComponent;
  stroke: number;
  actuated: boolean;
  signal: boolean;
  pressurizedPorts: Set<string>;
  technical?: boolean;
}

const baseLine = "fill-none stroke-steel";

function FlowArrow({ d, active = false }: { d: string; active?: boolean }) {
  return (
    <path
      d={d}
      className={active ? "fill-none stroke-air" : baseLine}
      strokeWidth={2}
      markerEnd="url(#component-flow-arrow)"
    />
  );
}

function Blocked({ x, y, up = true }: { x: number; y: number; up?: boolean }) {
  const end = up ? y - 13 : y + 13;
  return <path d={`M${x} ${y} V${end} M${x - 6} ${end} H${x + 6}`} className={baseLine} strokeWidth={2} />;
}

function Spring({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y} h5 l5 -8 l8 16 l8 -16 l8 16 l8 -16 l5 8 h5`}
      className={baseLine}
      strokeWidth={1.7}
    />
  );
}

/** número normalizado desenhado à direita da porta, nunca sobre a linha */
function PortNumber({ x, y, value }: { x: number; y: number; value: string }) {
  return (
    <text x={x + 6} y={y + 3} textAnchor="start" className="fill-muted-foreground font-mono text-[9px] font-semibold">
      {value}
    </text>
  );
}

/**
 * Símbolo de acionamento desenhado ao lado da caixa da válvula, na escala dos
 * diagramas didáticos (ISO 1219). `x` é a borda da caixa e `dir` o lado:
 * -1 desenha para a esquerda, +1 para a direita.
 */
function ActuationSymbol({
  type,
  x,
  y,
  dir,
  active,
}: {
  type: ActuationType;
  x: number;
  y: number;
  dir: 1 | -1;
  active: boolean;
}) {
  const cls = active ? "fill-none stroke-signal" : baseLine;
  const filled = active ? "fill-signal stroke-signal" : "fill-background stroke-steel";
  const soft = active ? "fill-signal/20 stroke-signal" : "fill-background stroke-steel";
  const p = (d: number, off = 0) => `${x + dir * d} ${y + off}`;
  const px = (d: number) => x + dir * d;
  /** rect ocupando as distâncias d0..d0+w a partir da borda */
  const rectAt = (d0: number, w: number, h: number) => ({
    x: dir > 0 ? px(d0) : px(d0 + w),
    y: y - h / 2,
    width: w,
    height: h,
  });
  const wall = <path d={`M${p(1, -16)} L${p(1, 16)}`} className={cls} strokeWidth={1.8} />;
  const stem = (to: number) => <path d={`M${p(1)} L${p(to)}`} className={cls} strokeWidth={1.8} />;

  const spring = (d0: number) => (
    <path
      d={`M${p(d0)} L${p(d0 + 6, -11)} L${p(d0 + 14, 11)} L${p(d0 + 22, -11)} L${p(d0 + 30, 11)} L${p(d0 + 38, -11)} L${p(d0 + 44)}`}
      className={cls}
      strokeWidth={1.8}
    />
  );

  const pilotBox = (d0: number) => {
    const r = rectAt(d0, 26, 30);
    const tipIn = px(d0);
    const back = px(d0 + 18);
    return (
      <g>
        <rect {...r} className={soft} strokeWidth={1.8} />
        <path
          d={`M${back} ${y - 9} L${tipIn + dir * 8} ${y} L${back} ${y + 9} Z`}
          className={filled}
          strokeWidth={1.5}
        />
      </g>
    );
  };

  const solenoidBox = (d0: number) => {
    const r = rectAt(d0, 26, 30);
    return (
      <g>
        <rect {...r} className={soft} strokeWidth={1.8} />
        <path d={`M${p(d0 + 3, 12)} L${p(d0 + 23, -12)}`} className={cls} strokeWidth={1.8} />
        <path d={`M${p(d0 + 9, 12)} L${p(d0 + 26, -8)}`} className={cls} strokeWidth={1.4} />
      </g>
    );
  };

  const manualCap = (d0: number) => (
    <path
      d={`M${p(d0, -13)} L${p(d0 + 12, -13)} A 13 13 0 0 ${dir > 0 ? 1 : 0} ${p(d0 + 12, 13)} L${p(d0, 13)}`}
      className={soft}
      strokeWidth={1.8}
    />
  );

  const roller = (d0: number) => (
    <g>
      <rect {...rectAt(d0, 12, 26)} className={soft} strokeWidth={1.7} />
      <circle cx={px(d0 + 22)} cy={y} r={10} className={soft} strokeWidth={1.8} />
    </g>
  );

  switch (type) {
    case "mola":
      return (
        <g>
          {spring(2)}
          <path d={`M${p(48, -14)} L${p(48, 14)}`} className={cls} strokeWidth={1.8} />
        </g>
      );
    case "centragemMolas":
      return (
        <g>
          {wall}
          {spring(4)}
          <path d={`M${p(50, -16)} L${p(50, 16)}`} className={cls} strokeWidth={1.8} />
        </g>
      );
    case "manual":
      return (
        <g>
          {wall}
          {stem(30)}
          {manualCap(30)}
        </g>
      );
    case "alavanca":
      return (
        <g>
          {wall}
          {stem(26)}
          <path d={`M${p(26)} L${p(38, -26)}`} className={cls} strokeWidth={2.4} />
          <circle cx={px(40)} cy={y - 30} r={6} className={filled} strokeWidth={1.5} />
        </g>
      );
    case "pedal":
      return (
        <g>
          {wall}
          {stem(24)}
          <path d={`M${p(16, -16)} L${p(50, -6)}`} className={cls} strokeWidth={3} />
          <path d={`M${p(24)} L${p(24, -12)}`} className={cls} strokeWidth={1.6} />
        </g>
      );
    case "came":
      return (
        <g>
          {wall}
          {stem(28)}
          <path
            d={`M${p(28, -13)} L${p(38, -13)} A 13 13 0 0 ${dir > 0 ? 1 : 0} ${p(38, 13)} L${p(28, 13)} Z`}
            className={soft}
            strokeWidth={1.8}
          />
        </g>
      );
    case "rolete":
      return (
        <g>
          {wall}
          {stem(22)}
          {roller(22)}
        </g>
      );
    case "roleteEscamoteavel":
      return (
        <g>
          {wall}
          {stem(22)}
          {roller(22)}
          <path d={`M${p(20, 18)} L${p(46, 26)}`} className={cls} strokeWidth={1.8} />
        </g>
      );
    case "piloto":
      return <g>{pilotBox(1)}</g>;
    case "servoPiloto":
      return (
        <g>
          {pilotBox(1)}
          {spring(28)}
        </g>
      );
    case "solenoide":
      return <g>{solenoidBox(1)}</g>;
    case "solenoideManual":
      return (
        <g>
          {solenoidBox(1)}
          {stem(1)}
          {manualCap(30)}
        </g>
      );
    case "servoSolenoide":
      return (
        <g>
          {solenoidBox(1)}
          {pilotBox(28)}
        </g>
      );
    case "botao":
    default:
      return (
        <g>
          {wall}
          {stem(26)}
          <rect {...rectAt(26, 16, 24)} className={soft} strokeWidth={1.8} />
          <path d={`M${p(42)} L${p(50)}`} className={cls} strokeWidth={1.8} />
          <path d={`M${p(50, -14)} L${p(50, 14)}`} className={cls} strokeWidth={2.2} />
        </g>
      );
  }
}


/** Símbolos técnicos pneumáticos inspirados no padrão didático ISO 1219 dos materiais de referência. */
export function ComponentGlyph({
  comp,
  stroke,
  actuated,
  signal,
  pressurizedPorts,
  technical = false,
}: GlyphProps) {
  const def = CATALOG[comp.type];
  const live = (port: string) => pressurizedPorts.has(`${comp.id}:${port}`);
  const activeBox = (active: boolean) =>
    active && !technical ? "fill-primary/15 stroke-primary" : "fill-background stroke-steel";

  const defs = (
    <defs>
      <marker id="component-flow-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
        <path d="M0 0 L5 2.5 L0 5 Z" className="fill-steel" />
      </marker>
    </defs>
  );

  switch (comp.type) {
    case "source":
      return (
        <svg width={def.width} height={def.height} viewBox={`0 0 ${def.width} ${def.height}`} aria-label="Fonte de ar comprimido">
          {defs}
          <text x={12} y={13} className="fill-foreground font-mono text-[10px] font-semibold">{comp.label}</text>
          <path d="M16 68 V42 H32" className={baseLine} strokeWidth={2} />
          <path d="M12 68 h8 M14 73 h4" className={baseLine} strokeWidth={1.5} />
          <circle cx={54} cy={42} r={22} className="fill-background stroke-steel" strokeWidth={2} />
          <path d="M43 31 L67 42 L43 53 Z" className="fill-air stroke-air" strokeWidth={1.5} />
          <path d="M76 42 H150" className={live("P") ? "fill-none stroke-air" : baseLine} strokeWidth={2} />
          <path d="M101 42 a14 14 0 0 1 28 0" className={baseLine} strokeWidth={1.5} />
          <path d="M115 42 l8 -8" className={baseLine} strokeWidth={1.5} />
          <text x={30} y={92} className="fill-air font-mono text-[11px] font-semibold">
            {(comp.pressure ?? 6).toFixed(1)} bar
          </text>
          <PortNumber x={136} y={50} value="1" />
        </svg>
      );

    case "valve32": {
      const y = 34;
      return (
        <svg width={def.width} height={def.height} viewBox={`0 0 ${def.width} ${def.height}`} aria-label="Válvula direcional 3/2 normalmente fechada">
          {defs}
          <text x={72} y={13} className="fill-foreground font-mono text-[10px] font-semibold">{comp.label}</text>
          <rect x={72} y={y} width={52} height={54} className={activeBox(actuated)} strokeWidth={1.7} />
          <rect x={124} y={y} width={52} height={54} className={activeBox(!actuated)} strokeWidth={1.7} />
          <FlowArrow d="M86 84 V42 H110" active={actuated} />
          <Blocked x={112} y={84} />
          <FlowArrow d="M150 38 V80 H166" active={!actuated} />
          <Blocked x={136} y={84} />
          <path d="M150 0 V34 M136 88 V129 M166 88 V112" className={baseLine} strokeWidth={1.7} />
          <path d="M158 124 H174 M161 119 H171 M164 114 H168" className={baseLine} strokeWidth={1.4} />
          <ActuationSymbol type={comp.actuation ?? "botao"} x={72} y={61} dir={-1} active={signal || actuated} />
          <ActuationSymbol type={comp.returnType ?? "mola"} x={176} y={61} dir={1} active={false} />
          <PortNumber x={150} y={8} value="2" />
          <PortNumber x={136} y={120} value="1" />
          <PortNumber x={166} y={104} value="3" />
        </svg>
      );
    }


    case "valve52": {
      const y = 34;
      return (
        <svg width={def.width} height={def.height} viewBox={`0 0 ${def.width} ${def.height}`} aria-label="Válvula direcional 5/2 com retorno por mola">
          {defs}
          <text x={40} y={13} className="fill-foreground font-mono text-[10px] font-semibold">{comp.label}</text>
          <rect x={40} y={y} width={76} height={54} className={activeBox(actuated)} strokeWidth={1.7} />
          <rect x={116} y={y} width={76} height={54} className={activeBox(!actuated)} strokeWidth={1.7} />
          <FlowArrow d="M78 84 V62 L58 40" active={actuated} />
          <FlowArrow d="M102 38 V60 L108 84" active={actuated} />
          <Blocked x={106} y={84} />
          <FlowArrow d="M154 84 V62 L178 40" active={!actuated} />
          <FlowArrow d="M134 38 V60 L126 84" active={!actuated} />
          <Blocked x={126} y={84} />
          <path d="M134 0 V34 M178 0 V34 M126 88 V112 M154 88 V129 M184 88 V112" className={baseLine} strokeWidth={1.7} />
          <path d="M118 124 H134 M121 119 H131 M124 114 H128 M176 124 H192 M179 119 H189 M182 114 H186" className={baseLine} strokeWidth={1.4} />
          <Actuation type={comp.actuation ?? "botao"} x={16} y={61} active={signal || actuated} />
          <Spring x={192} y={61} />
          <PortNumber x={134} y={8} value="4" />
          <PortNumber x={178} y={8} value="2" />
          <PortNumber x={126} y={104} value="5" />
          <PortNumber x={154} y={120} value="1" />
          <PortNumber x={184} y={104} value="3" />
        </svg>
      );
    }

    case "cylinderSingle":
    case "cylinderDouble": {
      const bodyX = 20;
      const bodyY = 24;
      const bodyW = 168;
      const bodyH = 48;
      const pistonX = bodyX + 20 + stroke * 104;
      return (
        <svg width={def.width} height={def.height} viewBox={`0 0 ${def.width} ${def.height}`} aria-label={`Cilindro de ${comp.type === "cylinderSingle" ? "simples" : "dupla"} ação`}>
          <text x={20} y={13} className="fill-foreground font-mono text-[10px] font-semibold">{comp.label}</text>
          <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} className="fill-background stroke-steel" strokeWidth={2} />
          {!technical && <rect x={bodyX + 2} y={bodyY + 2} width={Math.max(0, pistonX - bodyX - 3)} height={bodyH - 4} className={live("A") ? "fill-air/30" : "fill-transparent"} />}
          {!technical && comp.type === "cylinderDouble" && <rect x={pistonX + 3} y={bodyY + 2} width={Math.max(0, bodyX + bodyW - pistonX - 5)} height={bodyH - 4} className={live("B") ? "fill-air/30" : "fill-transparent"} />}
          <path d={`M${pistonX} ${bodyY} V${bodyY + bodyH}`} className="stroke-steel" strokeWidth={4} />
          <path d={`M${pistonX + 2} ${bodyY + bodyH / 2} H232`} className="stroke-steel" strokeWidth={4} />
          {comp.type === "cylinderSingle" && <path d={`M${pistonX + 5} 62 l10 -28 l10 28 l10 -28 l10 28`} className={baseLine} strokeWidth={1.6} />}
          <path d="M40 72 V100" className={live("A") ? "fill-none stroke-air" : baseLine} strokeWidth={2} />
          {comp.type === "cylinderDouble" && <path d="M168 72 V100" className={live("B") ? "fill-none stroke-air" : baseLine} strokeWidth={2} />}
          <PortNumber x={40} y={92} value="2" />
          {comp.type === "cylinderDouble" && <PortNumber x={168} y={92} value="4" />}
        </svg>
      );
    }

    case "button":
      return (
        <svg width={def.width} height={def.height} viewBox={`0 0 ${def.width} ${def.height}`} aria-label="Válvula 3/2 de acionamento manual">
          {defs}
          <text x={22} y={13} className="fill-foreground font-mono text-[10px] font-semibold">{comp.label}</text>
          <rect x={24} y={34} width={36} height={42} className={activeBox(signal)} strokeWidth={1.6} />
          <rect x={60} y={34} width={36} height={42} className={activeBox(!signal)} strokeWidth={1.6} />
          <FlowArrow d="M34 72 V42 H50" active={signal} />
          <Blocked x={52} y={72} />
          <FlowArrow d="M78 38 V68 H90" active={!signal} />
          <Blocked x={68} y={72} />
          <path d="M78 20 V34 M68 76 V102 M90 76 V92" className={baseLine} strokeWidth={1.6} />
          <path d="M84 104 H96 M86 100 H94 M88 96 H92" className={baseLine} strokeWidth={1.2} />
          <path d="M12 43 H24 M5 43 H19 M12 28 V43" className={signal ? "fill-none stroke-signal" : baseLine} strokeWidth={2} />
          <Spring x={96} y={55} />
          <PortNumber x={78} y={24} value="2" />
          <PortNumber x={68} y={96} value="1" />
          <PortNumber x={90} y={86} value="3" />
        </svg>
      );

    case "sensor":
      return (
        <svg width={def.width} height={def.height} viewBox={`0 0 ${def.width} ${def.height}`} aria-label="Válvula 3/2 de fim de curso por rolete">
          {defs}
          <text x={28} y={13} className="fill-foreground font-mono text-[10px] font-semibold">{comp.label}</text>
          <rect x={28} y={36} width={34} height={38} className={activeBox(signal)} strokeWidth={1.5} />
          <rect x={62} y={36} width={34} height={38} className={activeBox(!signal)} strokeWidth={1.5} />
          <FlowArrow d="M38 70 V43 H52" active={signal} />
          <Blocked x={54} y={70} />
          <FlowArrow d="M80 40 V67 H90" active={!signal} />
          <Blocked x={70} y={70} />
          <circle cx={10} cy={25} r={7} className={signal ? "fill-signal/20 stroke-signal" : "fill-background stroke-steel"} strokeWidth={1.5} />
          <path d="M15 30 L28 47" className={signal ? "stroke-signal" : "stroke-steel"} strokeWidth={2} />
          <Spring x={96} y={55} />
        </svg>
      );

    default:
      return null;
  }
}