import { CATALOG, portsForComponent } from "@/lib/pneumatics/catalog";
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

/**
 * Via de passagem. O material de referência desenha a seta como um traço
 * *reto* entre as duas conexões do quadro, com a ponta indicando o sentido do
 * fluxo — nunca em cotovelo.
 */
function FlowArrow({ d, active = false }: { d: string; active?: boolean }) {
  return (
    <path
      d={d}
      className={active ? "fill-none stroke-air" : baseLine}
      strokeWidth={2}
      strokeLinecap="butt"
      markerEnd="url(#component-flow-arrow)"
    />
  );
}

/**
 * Conexão de bloqueio (tampão). Conforme o material de referência, é
 * identificada "em ângulos retos": a haste encontra um traço transversal
 * formando um T. Nunca acompanha uma seta na mesma via.
 */
function Blocked({ x, y, up = true }: { x: number; y: number; up?: boolean }) {
  const end = up ? y - 13 : y + 13;
  return (
    <path
      d={`M${x} ${y} V${end} M${x - 7} ${end} H${x + 7}`}
      className={baseLine}
      strokeWidth={2}
      strokeLinecap="butt"
    />
  );
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
    <text
      x={x + 6}
      y={y + 3}
      textAnchor="start"
      className="fill-muted-foreground font-mono text-[9px] font-semibold"
    >
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
  const wall = (
    <path
      d={`M${p(1, -16)} L${p(1, 16)} M${p(1, -16)} L${p(8, -16)} M${p(1, 16)} L${p(8, 16)}`}
      className={cls}
      strokeWidth={1.8}
    />
  );
  const stem = (from: number, to: number) => (
    <path d={`M${p(from)} L${p(to)}`} className={cls} strokeWidth={1.8} />
  );

  const spring = (d0: number) => (
    <path
      d={`M${p(d0)} L${p(d0 + 6, -11)} L${p(d0 + 14, 11)} L${p(d0 + 22, -11)} L${p(d0 + 30, 11)} L${p(d0 + 38, -11)} L${p(d0 + 44)}`}
      className={cls}
      strokeWidth={1.8}
    />
  );

  const pilot = (d0: number) => {
    const tip = px(d0);
    const back = px(d0 + 16);
    return (
      <g>
        <path
          d={`M${back} ${y - 8} L${tip} ${y} L${back} ${y + 8} Z`}
          className={soft}
          strokeWidth={1.6}
        />
        <path d={`M${p(d0 + 16)} L${p(d0 + 23)}`} className={cls} strokeWidth={1.6} />
      </g>
    );
  };

  const solenoidBox = (d0: number) => {
    const r = rectAt(d0, 26, 30);
    return (
      <g>
        <rect {...r} className={soft} strokeWidth={1.8} />
        <path d={`M${p(d0 + 3, 12)} L${p(d0 + 23, -12)}`} className={cls} strokeWidth={1.8} />
      </g>
    );
  };

  const roller = (d0: number, cy = y) => (
    <g>
      <circle cx={px(d0)} cy={cy} r={7} className={soft} strokeWidth={1.8} />
      <circle cx={px(d0)} cy={cy} r={1.5} className={filled} strokeWidth={0} />
    </g>
  );

  const manualOverride = (d0: number) => (
    <g>
      <path
        d={`M${p(d0, -10)} L${p(d0 + 18, -10)} M${p(d0, 10)} L${p(d0 + 18, 10)}`}
        className={cls}
        strokeWidth={1.5}
      />
      <path
        d={`M${p(d0 + 5, -10)} L${p(d0 + 5, 10)} M${p(d0 + 13, -10)} L${p(d0 + 13, 10)}`}
        className={cls}
        strokeWidth={1.3}
      />
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
          {stem(1, 34)}
          <path d={`M${p(34, -11)} L${p(34, 11)}`} className={cls} strokeWidth={2.2} />
        </g>
      );
    case "alavanca":
      return (
        <g>
          {wall}
          {stem(1, 24)}
          <circle cx={px(24)} cy={y} r={3} className={soft} strokeWidth={1.5} />
          <path d={`M${p(26)} L${p(38, -26)}`} className={cls} strokeWidth={2.4} />
          <circle cx={px(40)} cy={y - 30} r={6} className={filled} strokeWidth={1.5} />
        </g>
      );
    case "pedal":
      return (
        <g>
          {wall}
          {stem(1, 22)}
          <path d={`M${p(16, -14)} L${p(48, -7)}`} className={cls} strokeWidth={3} />
          <path d={`M${p(22)} L${p(22, -12)}`} className={cls} strokeWidth={1.6} />
        </g>
      );
    case "came":
      return (
        <g>
          {wall}
          {stem(1, 28)}
          <path
            d={`M${p(28, -5)} H${px(47)}`}
            className={cls}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </g>
      );
    case "rolete":
      return (
        <g>
          {wall}
          {stem(1, 28)}
          {roller(35)}
        </g>
      );
    case "roleteEscamoteavel":
      return (
        <g>
          {wall}
          {stem(1, 18)}
          <path d={`M${p(18)} L${p(30, -13)} L${p(42, -13)}`} className={cls} strokeWidth={1.8} />
          <circle cx={px(30)} cy={y - 13} r={3} className={soft} strokeWidth={1.5} />
          {roller(49, y - 13)}
        </g>
      );
    case "pilotoSimples":
      return <g>{pilot(1)}</g>;
    case "pilotoDuplo":
      return (
        <g>
          {pilot(1)}
          {pilot(25)}
        </g>
      );
    case "servoPilotoSimples":
      return (
        <g>
          {pilot(1)}
          {pilot(25)}
        </g>
      );
    case "servoPilotoDuplo":
      return (
        <g>
          {pilot(1)}
          {pilot(25)}
          {pilot(49)}
        </g>
      );
    case "solenoideSimples":
      return <g>{solenoidBox(1)}</g>;
    case "solenoideDuplo":
      return (
        <g>
          {solenoidBox(1)}
          {solenoidBox(28)}
        </g>
      );
    case "servoSolenoideDuploManual":
      return (
        <g>
          {manualOverride(1)}
          {solenoidBox(20)}
          {pilot(47)}
        </g>
      );
    case "botao":
    default:
      return (
        <g>
          {wall}
          {stem(1, 30)}
          <path
            d={`M${p(30, -12)} A12 12 0 0 ${dir > 0 ? 1 : 0} ${p(30, 12)}`}
            className={cls}
            strokeWidth={1.8}
          />
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
      <marker
        id="component-flow-arrow"
        markerWidth="5"
        markerHeight="5"
        refX="4"
        refY="2.5"
        orient="auto"
      >
        <path d="M0 0 L5 2.5 L0 5 Z" className="fill-steel" />
      </marker>
    </defs>
  );

  switch (comp.type) {
    case "source":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Fonte de ar comprimido"
        >
          {defs}
          <text x={12} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <path d="M16 68 V42 H32" className={baseLine} strokeWidth={2} />
          <path d="M12 68 h8 M14 73 h4" className={baseLine} strokeWidth={1.5} />
          <circle cx={54} cy={42} r={22} className="fill-background stroke-steel" strokeWidth={2} />
          <path d="M43 31 L67 42 L43 53 Z" className="fill-air stroke-air" strokeWidth={1.5} />
          <path
            d="M76 42 H150"
            className={live("P") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
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
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula direcional 3/2 normalmente fechada"
        >
          {defs}
          <text x={72} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={72}
            y={y}
            width={52}
            height={54}
            className={activeBox(actuated)}
            strokeWidth={1.7}
          />
          <rect
            x={124}
            y={y}
            width={52}
            height={54}
            className={activeBox(!actuated)}
            strokeWidth={1.7}
          />
          {/* quadro acionado (deslocado -52): 1 -> 2 reto; a via 3 fica tampada */}
          <FlowArrow d="M84 84 L98 40" active={actuated} />
          <Blocked x={114} y={84} />
          {/* quadro em repouso: 2 -> 3 reto; a via 1 fica tampada */}
          <FlowArrow d="M150 38 L166 82" active={!actuated} />
          <Blocked x={136} y={84} />
          <path d="M150 0 V34 M136 88 V129 M166 88 V112" className={baseLine} strokeWidth={1.7} />
          <path
            d="M158 124 H174 M161 119 H171 M164 114 H168"
            className={baseLine}
            strokeWidth={1.4}
          />
          <ActuationSymbol
            type={comp.actuation ?? "botao"}
            x={72}
            y={61}
            dir={-1}
            active={signal || actuated}
          />
          <ActuationSymbol type={comp.returnType ?? "mola"} x={176} y={61} dir={1} active={false} />
          {portsForComponent(comp)
            .filter((port) => port.kind === "control")
            .map((port) => (
              <PortNumber key={port.id} x={port.x} y={port.y - 10} value={port.label} />
            ))}
          <PortNumber x={150} y={8} value="2" />
          <PortNumber x={136} y={120} value="1" />
          <PortNumber x={166} y={104} value="3" />
        </svg>
      );
    }

    case "valve52": {
      const y = 34;
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula direcional 5/2 com retorno por mola"
        >
          {defs}
          <text x={72} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={72}
            y={y}
            width={76}
            height={54}
            className={activeBox(actuated)}
            strokeWidth={1.7}
          />
          <rect
            x={148}
            y={y}
            width={76}
            height={54}
            className={activeBox(!actuated)}
            strokeWidth={1.7}
          />
          {/* quadro acionado (deslocado -76): 1 -> 4 e 2 -> 3; a via 5 fica tampada */}
          <FlowArrow d="M110 84 L134 40" active={actuated} />
          <FlowArrow d="M90 38 L82 82" active={actuated} />
          <Blocked x={140} y={84} />
          {/* quadro em repouso: 1 -> 2 e 4 -> 5; a via 3 fica tampada */}
          <FlowArrow d="M186 84 L166 40" active={!actuated} />
          <FlowArrow d="M210 38 L216 82" active={!actuated} />
          <Blocked x={158} y={84} />
          <path
            d="M166 0 V34 M210 0 V34 M158 88 V112 M186 88 V129 M216 88 V112"
            className={baseLine}
            strokeWidth={1.7}
          />
          <path
            d="M150 124 H166 M153 119 H163 M156 114 H160 M208 124 H224 M211 119 H221 M214 114 H218"
            className={baseLine}
            strokeWidth={1.4}
          />
          <ActuationSymbol
            type={comp.actuation ?? "botao"}
            x={72}
            y={61}
            dir={-1}
            active={signal || actuated}
          />
          <ActuationSymbol type={comp.returnType ?? "mola"} x={224} y={61} dir={1} active={false} />
          {portsForComponent(comp)
            .filter((port) => port.kind === "control")
            .map((port) => (
              <PortNumber key={port.id} x={port.x} y={port.y - 10} value={port.label} />
            ))}
          <PortNumber x={166} y={8} value="2" />
          <PortNumber x={210} y={8} value="4" />
          <PortNumber x={158} y={104} value="3" />
          <PortNumber x={186} y={120} value="1" />
          <PortNumber x={216} y={104} value="5" />
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
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label={`Cilindro de ${comp.type === "cylinderSingle" ? "simples" : "dupla"} ação`}
        >
          <text x={20} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={bodyX}
            y={bodyY}
            width={bodyW}
            height={bodyH}
            className="fill-background stroke-steel"
            strokeWidth={2}
          />
          {!technical && (
            <rect
              x={bodyX + 2}
              y={bodyY + 2}
              width={Math.max(0, pistonX - bodyX - 3)}
              height={bodyH - 4}
              className={live("A") ? "fill-air/30" : "fill-transparent"}
            />
          )}
          {!technical && comp.type === "cylinderDouble" && (
            <rect
              x={pistonX + 3}
              y={bodyY + 2}
              width={Math.max(0, bodyX + bodyW - pistonX - 5)}
              height={bodyH - 4}
              className={live("B") ? "fill-air/30" : "fill-transparent"}
            />
          )}
          <path
            d={`M${pistonX} ${bodyY} V${bodyY + bodyH}`}
            className="stroke-steel"
            strokeWidth={4}
          />
          <path
            d={`M${pistonX + 2} ${bodyY + bodyH / 2} H232`}
            className="stroke-steel"
            strokeWidth={4}
          />
          {comp.type === "cylinderSingle" && (
            <path
              d={`M${pistonX + 5} 62 l10 -28 l10 28 l10 -28 l10 28`}
              className={baseLine}
              strokeWidth={1.6}
            />
          )}
          <path
            d="M40 72 V100"
            className={live("A") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          {comp.type === "cylinderDouble" && (
            <path
              d="M168 72 V100"
              className={live("B") ? "fill-none stroke-air" : baseLine}
              strokeWidth={2}
            />
          )}
          <PortNumber x={40} y={92} value="2" />
          {comp.type === "cylinderDouble" && <PortNumber x={168} y={92} value="4" />}
        </svg>
      );
    }

    case "button":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula 3/2 de acionamento manual"
        >
          {defs}
          <text x={22} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={24}
            y={34}
            width={36}
            height={42}
            className={activeBox(signal)}
            strokeWidth={1.6}
          />
          <rect
            x={60}
            y={34}
            width={36}
            height={42}
            className={activeBox(!signal)}
            strokeWidth={1.6}
          />
          {/* acionado (deslocado -36): 1 -> 2 reto; via 3 tampada */}
          <FlowArrow d="M32 72 L42 42" active={signal} />
          <Blocked x={54} y={72} />
          {/* repouso: 2 -> 3 reto; via 1 tampada */}
          <FlowArrow d="M78 38 L90 70" active={!signal} />
          <Blocked x={68} y={72} />
          <path d="M78 20 V34 M68 76 V102 M90 76 V92" className={baseLine} strokeWidth={1.6} />
          <path d="M84 104 H96 M86 100 H94 M88 96 H92" className={baseLine} strokeWidth={1.2} />
          <path
            d="M12 43 H24 M5 43 H19 M12 28 V43"
            className={signal ? "fill-none stroke-signal" : baseLine}
            strokeWidth={2}
          />
          <Spring x={96} y={55} />
          <PortNumber x={78} y={24} value="2" />
          <PortNumber x={68} y={96} value="1" />
          <PortNumber x={90} y={86} value="3" />
        </svg>
      );

    case "sensor":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula 3/2 de fim de curso por rolete"
        >
          {defs}
          <text x={28} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={28}
            y={36}
            width={34}
            height={38}
            className={activeBox(signal)}
            strokeWidth={1.5}
          />
          <rect
            x={62}
            y={36}
            width={34}
            height={38}
            className={activeBox(!signal)}
            strokeWidth={1.5}
          />
          {/* acionado (deslocado -36): 1 -> 2 reto; via 3 tampada */}
          <FlowArrow d="M34 70 L44 43" active={signal} />
          <Blocked x={56} y={70} />
          {/* repouso: 2 -> 3 reto; via 1 tampada */}
          <FlowArrow d="M80 40 L92 68" active={!signal} />
          <Blocked x={70} y={70} />
          <path d="M80 20 V36 M70 74 V102 M92 74 V92" className={baseLine} strokeWidth={1.6} />
          <path d="M86 104 H98 M88 100 H96 M90 96 H94" className={baseLine} strokeWidth={1.2} />
          <circle
            cx={10}
            cy={25}
            r={7}
            className={signal ? "fill-signal/20 stroke-signal" : "fill-background stroke-steel"}
            strokeWidth={1.5}
          />
          <path
            d="M15 30 L28 47"
            className={signal ? "stroke-signal" : "stroke-steel"}
            strokeWidth={2}
          />
          <Spring x={96} y={55} />
          <PortNumber x={80} y={24} value="2" />
          <PortNumber x={70} y={96} value="1" />
          <PortNumber x={92} y={86} value="3" />
        </svg>
      );

    /* Silenciador de escape: triângulo aberto para a atmosfera. */
    case "exhaust":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Escape para a atmosfera"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <path
            d="M36 0 V34"
            className={live("R") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          <path d="M20 34 L52 34 L36 62 Z" className={baseLine} strokeWidth={2} />
          <path d="M24 70 H48 M28 76 H44 M32 82 H40" className={baseLine} strokeWidth={1.5} />
          <PortNumber x={36} y={22} value="3" />
        </svg>
      );

    /* Alternadora (OU) e simultaneidade (E): esfera dentro do corpo em T. */
    case "valveOr":
    case "valveAnd": {
      const isOr = comp.type === "valveOr";
      const out = live("A");
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label={isOr ? "Válvula alternadora OU" : "Válvula de simultaneidade E"}
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect x={24} y={30} width={72} height={48} className={activeBox(out)} strokeWidth={1.8} />
          {/* assento: no OU a esfera fecha a entrada sem pressão; no E, a de maior pressão */}
          <path
            d={isOr ? "M24 54 H44 M76 54 H96" : "M24 42 H44 M76 42 H96"}
            className={baseLine}
            strokeWidth={1.6}
          />
          <circle
            cx={60}
            cy={54}
            r={12}
            className={out ? "fill-air/25 stroke-air" : "fill-background stroke-steel"}
            strokeWidth={1.8}
          />
          <path d="M60 0 V30" className={out ? "fill-none stroke-air" : baseLine} strokeWidth={2} />
          <path
            d="M24 110 V92 H60 M96 110 V92 H60 M60 92 V78"
            className={baseLine}
            strokeWidth={1.8}
          />
          <text x={52} y={26} className="fill-muted-foreground font-mono text-[9px]">
            {isOr ? "OU" : "E"}
          </text>
          <PortNumber x={60} y={8} value="2" />
          <PortNumber x={24} y={104} value="1" />
          <PortNumber x={96} y={104} value="1'" />
        </svg>
      );
    }

    /* Temporizadora: 3/2 NF precedida de reguladora e reservatório. */
    case "valveTimer": {
      const done = !!pressurizedPorts.has(`${comp.id}:A`);
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula temporizadora"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={56}
            y={34}
            width={48}
            height={54}
            className={activeBox(done)}
            strokeWidth={1.7}
          />
          <rect
            x={104}
            y={34}
            width={48}
            height={54}
            className={activeBox(!done)}
            strokeWidth={1.7}
          />
          <FlowArrow d="M70 84 L84 40" active={done} />
          <Blocked x={96} y={84} />
          <FlowArrow d="M104 38 L120 82" active={!done} />
          <Blocked x={90} y={84} />
          <path d="M104 0 V34 M90 88 V129 M120 88 V112" className={baseLine} strokeWidth={1.7} />
          {/* reguladora ajustável + reservatório que definem o retardo */}
          <path d="M0 61 H30" className={baseLine} strokeWidth={1.7} />
          <path d="M22 50 L34 72" className={baseLine} strokeWidth={1.7} />
          <rect x={30} y={44} width={18} height={16} className={baseLine} strokeWidth={1.5} />
          <path d="M48 52 H56" className={baseLine} strokeWidth={1.7} />
          <Spring x={152} y={61} />
          <text x={4} y={100} className="fill-air font-mono text-[10px] font-semibold">
            {(comp.delay ?? 2).toFixed(1)} s
          </text>
          <PortNumber x={104} y={8} value="2" />
          <PortNumber x={90} y={120} value="1" />
          <PortNumber x={120} y={104} value="3" />
          <PortNumber x={2} y={52} value="12" />
        </svg>
      );
    }

    /* Retenção: esfera contra assento, livre em um sentido. */
    case "checkValve":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula de retenção"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <path
            d="M0 36 H44 M76 36 H120"
            className={live("A") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          <circle
            cx={52}
            cy={36}
            r={11}
            className={live("A") ? "fill-air/25 stroke-air" : "fill-background stroke-steel"}
            strokeWidth={1.8}
          />
          {/* assento em V: a esfera encosta e bloqueia o sentido contrário */}
          <path d="M66 24 L66 48" className={baseLine} strokeWidth={2.2} />
          <path d="M63 24 L72 36 L63 48" className={baseLine} strokeWidth={1.6} />
          <PortNumber x={4} y={28} value="1" />
          <PortNumber x={104} y={28} value="2" />
        </svg>
      );

    /* Escape rápido: retenção com saída direta para a atmosfera. */
    case "quickExhaust":
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula de escape rápido"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={30}
            y={22}
            width={72}
            height={48}
            className={activeBox(live("A"))}
            strokeWidth={1.8}
          />
          <path
            d="M0 46 H30 M102 46 H132"
            className={live("A") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          <circle
            cx={66}
            cy={46}
            r={11}
            className={live("A") ? "fill-air/25 stroke-air" : "fill-background stroke-steel"}
            strokeWidth={1.8}
          />
          <path d="M66 70 V86" className={baseLine} strokeWidth={1.8} />
          <path d="M54 86 L78 86 L66 106 Z" className={baseLine} strokeWidth={1.8} />
          <PortNumber x={4} y={38} value="1" />
          <PortNumber x={112} y={38} value="2" />
          <PortNumber x={70} y={92} value="3" />
        </svg>
      );

    /* Reguladoras de fluxo: estrangulamento, com ou sem retenção paralela. */
    case "throttle":
    case "throttleOneWay": {
      const oneWay = comp.type === "throttleOneWay";
      const flowing = live("A");
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label={
            oneWay ? "Reguladora de fluxo unidirecional" : "Reguladora de fluxo bidirecional"
          }
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          {oneWay ? (
            <>
              <rect
                x={24}
                y={20}
                width={84}
                height={56}
                className={activeBox(flowing)}
                strokeWidth={1.7}
              />
              <path
                d="M0 48 H24 M108 48 H132"
                className={flowing ? "fill-none stroke-air" : baseLine}
                strokeWidth={2}
              />
              {/* ramo estrangulado */}
              <path d="M24 34 H108" className={baseLine} strokeWidth={1.6} />
              <path d="M56 22 L74 46" className={baseLine} strokeWidth={1.8} />
              {/* ramo com retenção */}
              <path d="M24 62 H50 M82 62 H108" className={baseLine} strokeWidth={1.6} />
              <circle
                cx={58}
                cy={62}
                r={8}
                className="fill-background stroke-steel"
                strokeWidth={1.6}
              />
              <path d="M70 54 L70 70" className={baseLine} strokeWidth={2} />
            </>
          ) : (
            <>
              <path
                d="M0 42 H120"
                className={flowing ? "fill-none stroke-air" : baseLine}
                strokeWidth={2}
              />
              {/* estrangulamento simétrico nos dois sentidos */}
              <path d="M44 22 L52 42 L44 62" className={baseLine} strokeWidth={2} />
              <path d="M76 22 L68 42 L76 62" className={baseLine} strokeWidth={2} />
            </>
          )}
          <path
            d={oneWay ? "M92 14 L64 82" : "M84 18 L36 66"}
            className={baseLine}
            strokeWidth={1.6}
          />
          <text x={4} y={90} className="fill-air font-mono text-[10px] font-semibold">
            {Math.round((comp.restriction ?? 1) * 100)}%
          </text>
          <PortNumber x={0} y={oneWay ? 40 : 34} value="1" />
          <PortNumber x={oneWay ? 112 : 100} y={oneWay ? 40 : 34} value="2" />
        </svg>
      );
    }

    default:
      return null;
  }
}