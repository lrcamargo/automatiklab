import { CATALOG, portsForComponent } from "@/lib/pneumatics/catalog";
import type { ActuationType, PlacedComponent } from "@/lib/pneumatics/types";

interface GlyphProps {
  comp: PlacedComponent;
  stroke: number;
  actuated: boolean;
  signal: boolean;
  pressurizedPorts: Set<string>;
  /** contador pneumático: leitura atual do mostrador */
  count?: number;
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

  /*
   * Piloto pneumático (Quadro 13). O triângulo aponta para a válvula.
   * `external` desenha o traço de ligação que caracteriza o piloto positivo
   * EXTERNO; o piloto interno (servo-piloto) encosta direto na caixa.
   */
  const pilot = (d0: number, external = true) => {
    const tip = px(d0);
    const back = px(d0 + 16);
    return (
      <g>
        <path
          d={`M${back} ${y - 8} L${tip} ${y} L${back} ${y + 8} Z`}
          className={soft}
          strokeWidth={1.6}
        />
        {external && <path d={`M${p(d0 + 16)} L${p(d0 + 23)}`} className={cls} strokeWidth={1.6} />}
      </g>
    );
  };

  /**
   * Solenoide (Quadro 12): retângulo com uma diagonal para uma bobina e duas
   * diagonais cruzadas em X para duas bobinas — não dois retângulos lado a
   * lado. `coils` escolhe entre as duas formas.
   */
  const solenoidBox = (d0: number, coils: 1 | 2 = 1) => {
    // retângulo deitado: a norma usa uma caixa mais larga que alta
    const r = rectAt(d0, 34, 24);
    return (
      <g>
        <rect {...r} className={soft} strokeWidth={1.8} />
        <path d={`M${p(d0 + 3, 9)} L${p(d0 + 31, -9)}`} className={cls} strokeWidth={1.8} />
        {coils === 2 && (
          <path d={`M${p(d0 + 3, -9)} L${p(d0 + 31, 9)}`} className={cls} strokeWidth={1.8} />
        )}
      </g>
    );
  };

  /** Rolete (Quadro 11): círculo VAZADO com um ponto no centro. */
  const roller = (d0: number, cy = y) => (
    <g>
      <circle
        cx={px(d0)}
        cy={cy}
        r={7}
        className="fill-background stroke-steel"
        strokeWidth={1.8}
      />
      <circle cx={px(d0)} cy={cy} r={2} className="fill-steel stroke-steel" strokeWidth={0} />
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
    // A mola é apenas o ziguezague encostado na caixa: não leva traço de topo.
    case "mola":
      return <g>{spring(2)}</g>;
    case "centragemMolas":
      return <g>{spring(2)}</g>;
    case "manual":
      return (
        <g>
          {stem(1, 34)}
          <path d={`M${p(34, -11)} L${p(34, 11)}`} className={cls} strokeWidth={2.2} />
        </g>
      );
    /*
     * Alavanca (Quadro 10): haste horizontal encostada na válvula, trecho
     * vertical curto e um pequeno círculo VAZADO no topo.
     */
    case "alavanca":
      return (
        <g>
          {stem(1, 30)}
          <path d={`M${p(30)} L${p(30, -20)}`} className={cls} strokeWidth={1.8} />
          <circle
            cx={px(30)}
            cy={y - 26}
            r={5}
            className="fill-none stroke-steel"
            strokeWidth={1.6}
          />
        </g>
      );
    /*
     * Pedal (Quadro 10): a placa é formada por DUAS LINHAS PARALELAS
     * levemente inclinadas, fechadas por uma aresta à esquerda.
     */
    case "pedal":
      return (
        <g>
          {stem(1, 12)}
          <path d={`M${p(12, -16)} L${p(42, -9)}`} className={cls} strokeWidth={1.8} />
          <path d={`M${p(12, -4)} L${p(42, 2)}`} className={cls} strokeWidth={1.8} />
          <path d={`M${p(12, -16)} L${p(12, -4)}`} className={cls} strokeWidth={1.8} />
        </g>
      );
    /*
     * Pino adaptador (Quadro 11): haste de ponta ARREDONDADA, com o
     * comprimento ajustável — não um bloco reto.
     */
    case "came":
      return (
        <g>
          <path
            d={`M${p(1, -9)} L${p(24, -9)} A9 9 0 0 ${dir > 0 ? 1 : 0} ${p(24, 9)} L${p(1, 9)}`}
            className={cls}
            strokeWidth={1.8}
            fill="none"
          />
          <path d={`M${p(1, -9)} L${p(1, 9)}`} className={cls} strokeWidth={1.8} />
        </g>
      );
    /*
     * Rolete fixo (Quadro 11): círculo vazado com ponto central, ligado à
     * válvula por uma haste horizontal. Aciona em qualquer sentido.
     */
    case "rolete":
      return (
        <g>
          {stem(1, 28)}
          {roller(35)}
        </g>
      );
    /*
     * Rolete articulado / escamoteável (Quadro 11): dois círculos vazados
     * ligados por um braço inclinado, com a seta horizontal no topo indicando
     * o único sentido em que ele aciona.
     */
    case "roleteEscamoteavel":
      return (
        <g>
          {stem(1, 20)}
          <path d={`M${p(20)} L${p(38, -18)}`} className={cls} strokeWidth={1.8} />
          {roller(20)}
          {roller(40, y - 20)}
          <path d={`M${p(18, -30)} L${p(44, -30)}`} className={cls} strokeWidth={1.5} />
          <path
            d={`M${p(38, -34)} L${p(44, -30)} L${p(38, -26)}`}
            className={cls}
            strokeWidth={1.4}
            fill="none"
          />
        </g>
      );
    /*
     * Pilotagem pneumática.
     *
     * "Piloto duplo" descreve a válvula inteira — pilotada dos DOIS lados —
     * e não dois triângulos empilhados de um lado só. Por isso cada lado
     * desenha apenas o seu piloto; é a combinação entre acionamento e retorno
     * que produz a dupla pilotagem.
     *
     * O servo-piloto (piloto positivo interno) acrescenta o pré-comando: um
     * piloto menor alimentando o piloto principal, desenhados em série.
     */
    case "pilotoSimples":
    case "pilotoDuplo":
      return <g>{pilot(1)}</g>;
    /*
     * Servo-piloto = piloto positivo INTERNO (Quadro 13): o triângulo encosta
     * direto na caixa da válvula, sem o traço de ligação externa.
     */
    case "servoPilotoSimples":
    case "servoPilotoDuplo":
      return <g>{pilot(1, false)}</g>;
    case "solenoideSimples":
      return <g>{solenoidBox(1)}</g>;
    case "solenoideDuplo":
      return <g>{solenoidBox(1, 2)}</g>;
    case "servoSolenoideDuploManual":
      return (
        <g>
          {manualOverride(1)}
          {solenoidBox(20)}
          {pilot(47)}
        </g>
      );
    /*
     * Botão pulsador: um semicírculo fechado sobre a haste — a face plana
     * encosta na haste e a curva é a cabeça do botão.
     */
    case "botao":
    default:
      return (
        <g>
          {stem(1, 28)}
          <path
            d={`M${p(28, -12)} L${p(28, 12)} A12 12 0 0 ${dir > 0 ? 0 : 1} ${p(28, -12)} Z`}
            className={soft}
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
  count = 0,
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
          {/*
            Compressor (Quadro 4): círculo com o triângulo cheio de admissão
            e, à direita, o eixo motriz com a seta — foi este eixo, e não o
            semicírculo, que a norma traz.
          */}
          <path d="M16 68 V42 H32" className={baseLine} strokeWidth={2} />
          <path d="M12 68 h8 M14 73 h4" className={baseLine} strokeWidth={1.5} />
          <circle cx={54} cy={42} r={22} className="fill-background stroke-steel" strokeWidth={2} />
          <path d="M43 31 L67 42 L43 53 Z" className="fill-air stroke-air" strokeWidth={1.5} />
          <path d="M70 30 H86 M70 38 H86" className={baseLine} strokeWidth={1.5} />
          <path d="M78 30 L88 18" className={baseLine} strokeWidth={1.5} />
          <path d="M88 18 L80 21 M88 18 L85 26" className={baseLine} strokeWidth={1.4} />
          <path
            d="M76 42 H150"
            className={live("P") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
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

    /*
     * Cilindros — ISO 1219 (Quadro 6 da apostila SENAI).
     *
     * Um único símbolo cobre todas as variantes, escolhidas no painel:
     *  - simples ação com retorno por mola (ar atrás, repouso recuado);
     *  - simples ação com avanço por mola (ar na frente, repouso avançado);
     *  - dupla ação, opcionalmente com haste passante;
     *  - amortecimento de fim de curso fixo ou regulável.
     *
     * A mola é o ziguezague que ocupa a câmara do lado contra o qual ela
     * empurra; o amortecimento é o retângulo estreito junto ao fundo, com a
     * seta diagonal quando é regulável.
     */
    case "cylinderSingle":
    case "cylinderDouble": {
      const bodyX = 20;
      const bodyY = 24;
      const bodyW = 168;
      const bodyH = 48;
      const single = comp.type === "cylinderSingle";
      const frontSpring = single && comp.springAction === "avancoMola";
      const throughRod = !single && comp.throughRod === true;
      const cushioning = comp.cushioning ?? "nenhum";
      const pistonX = bodyX + 20 + stroke * 104;
      const midY = bodyY + bodyH / 2;

      /** ziguezague da mola entre dois x, preenchendo a câmara */
      const springPath = (from: number, to: number) => {
        const span = Math.max(0, to - from);
        const coils = 6;
        const step = span / (coils * 2);
        const top = bodyY + 6;
        const bottom = bodyY + bodyH - 6;
        let d = `M${from} ${midY}`;
        for (let i = 0; i < coils * 2; i += 1) {
          d += ` L${from + step * (i + 0.5)} ${i % 2 === 0 ? top : bottom}`;
        }
        return `${d} L${to} ${midY}`;
      };

      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label={`Cilindro de ${single ? "simples" : "dupla"} ação`}
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
          {!technical && !single && (
            <rect
              x={pistonX + 3}
              y={bodyY + 2}
              width={Math.max(0, bodyX + bodyW - pistonX - 5)}
              height={bodyH - 4}
              className={live("B") ? "fill-air/30" : "fill-transparent"}
            />
          )}
          {/* êmbolo */}
          <path
            d={`M${pistonX} ${bodyY} V${bodyY + bodyH}`}
            className="stroke-steel"
            strokeWidth={4}
          />
          {/* haste dianteira, sempre presente */}
          <path d={`M${pistonX + 2} ${midY} H232`} className="stroke-steel" strokeWidth={4} />
          {/* haste passante: sai também pelo fundo */}
          {throughRod && (
            <path d={`M0 ${midY} H${pistonX - 2}`} className="stroke-steel" strokeWidth={4} />
          )}
          {/* mola: à frente do êmbolo (avanço por mola) ou atrás (retorno) */}
          {single &&
            (frontSpring ? (
              <path
                d={springPath(bodyX + 2, pistonX - 2)}
                className={baseLine}
                strokeWidth={1.6}
                fill="none"
              />
            ) : (
              <path
                d={springPath(pistonX + 2, bodyX + bodyW - 2)}
                className={baseLine}
                strokeWidth={1.6}
                fill="none"
              />
            ))}
          {/* amortecimento de fim de curso */}
          {cushioning !== "nenhum" && (
            <>
              <rect
                x={bodyX + 6}
                y={bodyY + 8}
                width={14}
                height={bodyH - 16}
                className={baseLine}
                strokeWidth={1.4}
                fill="none"
              />
              {cushioning === "regulavel" && (
                <>
                  <path
                    d={`M${bodyX + 2} ${bodyY + bodyH - 4} L${bodyX + 26} ${bodyY + 4}`}
                    className={baseLine}
                    strokeWidth={1.5}
                  />
                  <path
                    d={`M${bodyX + 26} ${bodyY + 4} L${bodyX + 18} ${bodyY + 7} M${bodyX + 26} ${bodyY + 4} L${bodyX + 23} ${bodyY + 12}`}
                    className={baseLine}
                    strokeWidth={1.4}
                  />
                </>
              )}
            </>
          )}
          {/* entradas de ar */}
          <path
            d={`M40 ${bodyY + bodyH} V100`}
            className={live("A") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          {!single && (
            <path
              d={`M168 ${bodyY + bodyH} V100`}
              className={live("B") ? "fill-none stroke-air" : baseLine}
              strokeWidth={2}
            />
          )}
          <PortNumber x={40} y={92} value="2" />
          {!single && <PortNumber x={168} y={92} value="4" />}
        </svg>
      );
    }

    /*
     * Motor pneumático — Quadro 7. Círculo com dois triângulos cheios de
     * escoamento apontando para dentro (reversível) e o eixo com as setas
     * dos dois sentidos de rotação.
     */
    case "rotaryMotor": {
      const a = live("A");
      const b = live("B");
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Motor pneumático reversível"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <circle cx={66} cy={66} r={38} className={activeBox(a || b)} strokeWidth={2} />
          {/* triângulos de escoamento, apontando para dentro do círculo */}
          <path
            d="M56 34 L76 34 L66 52 Z"
            className={a ? "fill-air stroke-air" : "fill-steel stroke-steel"}
            strokeWidth={1.4}
          />
          <path
            d="M56 98 L76 98 L66 80 Z"
            className={b ? "fill-air stroke-air" : "fill-steel stroke-steel"}
            strokeWidth={1.4}
          />
          <path d="M66 0 V28" className={a ? "fill-none stroke-air" : baseLine} strokeWidth={2} />
          <path
            d="M66 104 V132"
            className={b ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          {/* eixo com os dois sentidos de rotação */}
          <path d="M104 58 H128 M104 74 H128" className={baseLine} strokeWidth={1.7} />
          <path d="M120 46 L130 52 L120 58" className={baseLine} strokeWidth={1.6} fill="none" />
          <path d="M120 86 L130 80 L120 74" className={baseLine} strokeWidth={1.6} fill="none" />
          <PortNumber x={70} y={20} value="2" />
          <PortNumber x={70} y={124} value="4" />
        </svg>
      );
    }

    /*
     * Atuador de giro controlado (oscilador) — Quadro 7. Semicírculo de
     * ângulo limitado, alimentado pelas duas entradas, com o eixo saindo pela
     * direita.
     */
    case "rotaryOscillator": {
      const a = live("A");
      const b = live("B");
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Atuador rotativo de giro controlado"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          {/* semicírculo: corpo do oscilador */}
          <path
            d="M74 20 A38 38 0 0 1 74 96"
            className={activeBox(a || b)}
            strokeWidth={2}
            fill="none"
          />
          <path d="M74 20 V96" className={activeBox(a || b)} strokeWidth={2} />
          <path d="M0 40 H74" className={a ? "fill-none stroke-air" : baseLine} strokeWidth={2} />
          <path d="M0 74 H74" className={b ? "fill-none stroke-air" : baseLine} strokeWidth={2} />
          {/* eixo */}
          <path d="M112 58 H156" className={baseLine} strokeWidth={2} />
          <path d="M140 46 L152 52 L140 58" className={baseLine} strokeWidth={1.6} fill="none" />
          <PortNumber x={4} y={32} value="2" />
          <PortNumber x={4} y={66} value="4" />
        </svg>
      );
    }

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
            d="M18 0 V18"
            className={live("R") ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          <path d="M8 18 L28 18 L18 35 Z" className={baseLine} strokeWidth={2} />
          <PortNumber x={18} y={12} value="3" />
        </svg>
      );

    /* Alternadora (OU) e simultaneidade (E): esfera dentro do corpo em T. */
    /*
     * Alternadora (OU) e simultaneidade (E) — ISO 1219.
     * Corpo único em T: duas entradas 1 e 1' na base, saída 2 no topo, e uma
     * esfera que se desloca contra o assento do lado sem pressão. No OU a
     * esfera fecha a entrada despressurizada; no E ela fecha a de MAIOR
     * pressão, deixando passar a menor.
     */
    case "valveOr":
    case "valveAnd": {
      const isOr = comp.type === "valveOr";
      const out = live("A");
      const p1 = live("P1");
      const p2 = live("P2");
      // a esfera encosta no lado oposto ao que está passando
      const ballX = isOr
        ? p1 && !p2
          ? 74
          : p2 && !p1
            ? 46
            : 60
        : p1 && !p2
          ? 74
          : p2 && !p1
            ? 46
            : 60;
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label={isOr ? "Válvula alternadora (OU)" : "Válvula de simultaneidade (E)"}
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          {/* corpo da válvula */}
          <rect x={20} y={34} width={80} height={44} className={activeBox(out)} strokeWidth={1.8} />
          {/* assentos cônicos nas duas entradas */}
          <path d="M20 34 L40 56 L20 78" className={baseLine} strokeWidth={1.6} fill="none" />
          <path d="M100 34 L80 56 L100 78" className={baseLine} strokeWidth={1.6} fill="none" />
          {/* esfera obturadora */}
          <circle
            cx={ballX}
            cy={56}
            r={10}
            className={out ? "fill-air/30 stroke-air" : "fill-background stroke-steel"}
            strokeWidth={1.8}
          />
          {/* saída 2 no topo */}
          <path d="M60 0 V34" className={out ? "fill-none stroke-air" : baseLine} strokeWidth={2} />
          {/* entradas 1 e 1' na base */}
          <path
            d="M24 110 V78"
            className={p1 ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          <path
            d="M96 110 V78"
            className={p2 ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          <text x={48} y={28} className="fill-muted-foreground font-mono text-[9px] font-semibold">
            {isOr ? "OU" : "E"}
          </text>
          <PortNumber x={60} y={8} value="2" />
          <PortNumber x={24} y={104} value="1" />
          <PortNumber x={96} y={104} value="1'" />
        </svg>
      );
    }

    /*
     * Temporizadora — ISO 1219. Conjunto de três elementos num quadro
     * tracejado: reguladora unidirecional, reservatório de ar e a 3/2 NF
     * que comuta quando o reservatório enche.
     */
    case "valveTimer": {
      const done = live("A");
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
          {/* invólucro tracejado do conjunto */}
          <rect
            x={2}
            y={20}
            width={164}
            height={96}
            className="fill-none stroke-steel"
            strokeWidth={1}
            strokeDasharray="5 4"
          />
          {/* piloto 12 entra pela reguladora unidirecional */}
          <path d="M0 61 H18" className={baseLine} strokeWidth={1.7} />
          <rect x={18} y={44} width={26} height={34} className={baseLine} strokeWidth={1.4} />
          <path d="M22 74 L40 48" className={baseLine} strokeWidth={1.8} />
          <path d="M31 44 L31 78" className={baseLine} strokeWidth={1} strokeDasharray="3 3" />
          {/* reservatório de ar */}
          <path d="M44 61 H56" className={baseLine} strokeWidth={1.7} />
          <path d="M56 48 H72 V74 H56 Z" className={baseLine} strokeWidth={1.6} />
          <path d="M72 61 H86" className={baseLine} strokeWidth={1.7} />
          {/* 3/2 NF pilotada */}
          <rect
            x={86}
            y={34}
            width={38}
            height={54}
            className={activeBox(done)}
            strokeWidth={1.7}
          />
          <rect
            x={124}
            y={34}
            width={38}
            height={54}
            className={activeBox(!done)}
            strokeWidth={1.7}
          />
          <FlowArrow d="M96 84 L110 40" active={done} />
          <Blocked x={116} y={84} />
          <FlowArrow d="M136 38 L150 82" active={!done} />
          <Blocked x={130} y={84} />
          <path d="M104 0 V34 M90 88 V129 M120 88 V112" className={baseLine} strokeWidth={1.7} />
          <text x={4} y={112} className="fill-air font-mono text-[10px] font-semibold">
            {(comp.delay ?? 2).toFixed(1)} s
          </text>
          <PortNumber x={104} y={8} value="2" />
          <PortNumber x={90} y={120} value="1" />
          <PortNumber x={120} y={104} value="3" />
          <PortNumber x={0} y={52} value="12" />
        </svg>
      );
    }

    /*
     * Retenção — ISO 1219: esfera empurrada contra um assento cônico. O
     * traço do assento fica do lado bloqueado; a seta indica o sentido livre.
     */
    case "checkValve": {
      const flowing = live("A");
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
            d="M0 36 H40 M80 36 H120"
            className={flowing ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />
          {/* assento cônico: abre para a esquerda, veda contra a esfera */}
          <path d="M40 18 L40 54" className={baseLine} strokeWidth={1.8} />
          <path d="M40 18 L62 36 L40 54" className={baseLine} strokeWidth={1.8} fill="none" />
          <circle
            cx={70}
            cy={36}
            r={9}
            className={flowing ? "fill-air/30 stroke-air" : "fill-background stroke-steel"}
            strokeWidth={1.8}
          />
          <PortNumber x={4} y={28} value="1" />
          <PortNumber x={104} y={28} value="2" />
        </svg>
      );
    }

    /*
     * Reguladoras de fluxo — ISO 1219.
     *
     * O estrangulamento é desenhado como dois arcos que se aproximam da linha
     * de fluxo pelo topo e pela base, formando uma garganta (perfil de
     * Venturi). A seta diagonal atravessando o conjunto indica que a
     * restrição é ajustável.
     *
     * Na bidirecional o estrangulamento fica sozinho sobre a linha. Na
     * unidirecional ele é montado em paralelo com uma retenção, e o par fica
     * dentro do invólucro tracejado que identifica o conjunto: o ar é
     * estrangulado num sentido e passa livre pela retenção no sentido oposto.
     */
    case "throttle":
    case "throttleOneWay": {
      const oneWay = comp.type === "throttleOneWay";
      const flowing = live("A");
      const liveLine = flowing ? "fill-none stroke-air" : baseLine;
      /** garganta do estrangulamento entre x0 e x1, centrada em cy */
      const throat = (x0: number, x1: number, cy: number, gap: number) => {
        const mid = (x0 + x1) / 2;
        const h = 20;
        return (
          <>
            <path
              d={`M${x0} ${cy - h} Q${mid} ${cy - h} ${mid} ${cy - gap} Q${mid} ${cy - h} ${x1} ${cy - h}`}
              className={baseLine}
              strokeWidth={1.9}
              fill="none"
            />
            <path
              d={`M${x0} ${cy + h} Q${mid} ${cy + h} ${mid} ${cy + gap} Q${mid} ${cy + h} ${x1} ${cy + h}`}
              className={baseLine}
              strokeWidth={1.9}
              fill="none"
            />
          </>
        );
      };
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
                y={18}
                width={84}
                height={62}
                className="fill-none stroke-steel"
                strokeWidth={1}
                strokeDasharray="5 4"
              />
              <path d="M0 48 H24" className={liveLine} strokeWidth={2} />
              <path d="M108 48 H132" className={liveLine} strokeWidth={2} />
              {/* ramo superior: estrangulamento ajustável */}
              <path d="M24 48 V30 H48" className={baseLine} strokeWidth={1.6} />
              <path d="M84 30 H108 V48" className={baseLine} strokeWidth={1.6} />
              {throat(48, 84, 30, 6)}
              {/* ramo inferior: retenção, livre no sentido oposto */}
              <path d="M24 48 V66 H48" className={baseLine} strokeWidth={1.6} />
              <path d="M78 66 H108 V48" className={baseLine} strokeWidth={1.6} />
              <path d="M66 56 L66 76" className={baseLine} strokeWidth={1.8} />
              <path d="M78 66 L62 58 L62 74 Z" className={baseLine} strokeWidth={1.5} fill="none" />
              {/* seta diagonal da regulagem */}
              <path d="M100 92 L34 8" className={baseLine} strokeWidth={1.8} />
              <path d="M34 8 L44 17 M34 8 L46 11" className={baseLine} strokeWidth={1.6} />
            </>
          ) : (
            <>
              <path d="M0 42 H120" className={liveLine} strokeWidth={2} />
              {throat(36, 84, 42, 7)}
              {/* seta diagonal da regulagem */}
              <path d="M98 74 L28 10" className={baseLine} strokeWidth={1.8} />
              <path d="M28 10 L38 18 M28 10 L39 13" className={baseLine} strokeWidth={1.6} />
            </>
          )}
          <text x={4} y={oneWay ? 94 : 80} className="fill-air font-mono text-[10px] font-semibold">
            {Math.round((comp.restriction ?? 1) * 100)}%
          </text>
          <PortNumber x={0} y={oneWay ? 40 : 34} value="1" />
          <PortNumber x={oneWay ? 112 : 100} y={oneWay ? 40 : 34} value="2" />
        </svg>
      );
    }

    /* 4/2 vias: dois quadros, quatro vias, escape único em 3. */
    case "valve42": {
      const y = 34;
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula direcional 4/2"
        >
          {defs}
          <text x={100} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={100}
            y={y}
            width={76}
            height={54}
            className={activeBox(actuated)}
            strokeWidth={1.7}
          />
          <rect
            x={176}
            y={y}
            width={76}
            height={54}
            className={activeBox(!actuated)}
            strokeWidth={1.7}
          />
          {/* acionada: 1 -> 4 e 2 -> 3 */}
          <FlowArrow d="M138 84 L162 40" active={actuated} />
          <FlowArrow d="M118 38 L110 82" active={actuated} />
          {/* repouso: 1 -> 2 e 4 -> 3 */}
          <FlowArrow d="M210 84 L190 40" active={!actuated} />
          <FlowArrow d="M234 38 L240 82" active={!actuated} />
          <path
            d="M166 0 V34 M210 0 V34 M166 88 V112 M210 88 V129"
            className={baseLine}
            strokeWidth={1.7}
          />
          <ActuationSymbol
            type={comp.actuation ?? "botao"}
            x={100}
            y={61}
            dir={-1}
            active={signal || actuated}
          />
          <ActuationSymbol type={comp.returnType ?? "mola"} x={252} y={61} dir={1} active={false} />
          {portsForComponent(comp)
            .filter((port) => port.kind === "control")
            .map((port) => (
              <PortNumber key={port.id} x={port.x} y={port.y - 10} value={port.label} />
            ))}
          <PortNumber x={166} y={8} value="2" />
          <PortNumber x={210} y={8} value="4" />
          <PortNumber x={166} y={104} value="3" />
          <PortNumber x={210} y={120} value="1" />
        </svg>
      );
    }

    /* 5/3 centro fechado: o quadro central bloqueia todas as vias. */
    case "valve53": {
      const y = 34;
      const centered = !actuated;
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Válvula direcional 5/3 com centro fechado"
        >
          {defs}
          <text x={110} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={110}
            y={y}
            width={76}
            height={54}
            className={activeBox(actuated)}
            strokeWidth={1.7}
          />
          <rect
            x={186}
            y={y}
            width={76}
            height={54}
            className={activeBox(centered)}
            strokeWidth={1.7}
          />
          <rect
            x={262}
            y={y}
            width={76}
            height={54}
            className={activeBox(false)}
            strokeWidth={1.7}
          />
          {/* quadro esquerdo: 1 -> 4 e 2 -> 3 */}
          <FlowArrow d="M148 84 L172 40" active={actuated} />
          <FlowArrow d="M128 38 L120 82" active={actuated} />
          {/* centro fechado: todas as vias tampadas */}
          <Blocked x={208} y={84} />
          <Blocked x={228} y={84} />
          <Blocked x={248} y={84} />
          <Blocked x={208} y={34} up={false} />
          <Blocked x={248} y={34} up={false} />
          {/* quadro direito: 1 -> 2 e 4 -> 5 */}
          <FlowArrow d="M300 84 L280 40" active={false} />
          <FlowArrow d="M320 38 L330 82" active={false} />
          <path
            d="M208 0 V34 M252 0 V34 M200 88 V112 M228 88 V129 M258 88 V112"
            className={baseLine}
            strokeWidth={1.7}
          />
          <ActuationSymbol
            type={comp.actuation ?? "pilotoSimples"}
            x={110}
            y={61}
            dir={-1}
            active={signal || actuated}
          />
          <ActuationSymbol
            type={comp.returnType ?? "centragemMolas"}
            x={338}
            y={61}
            dir={1}
            active={false}
          />
          {portsForComponent(comp)
            .filter((port) => port.kind === "control")
            .map((port) => (
              <PortNumber key={port.id} x={port.x} y={port.y - 10} value={port.label} />
            ))}
          <PortNumber x={208} y={8} value="2" />
          <PortNumber x={252} y={8} value="4" />
          <PortNumber x={200} y={104} value="3" />
          <PortNumber x={228} y={120} value="1" />
          <PortNumber x={258} y={104} value="5" />
        </svg>
      );
    }

    /* Contador pneumático: mostrador de cinco dígitos, portas Z, Y, P e A. */
    case "counter": {
      const reached = live("A");
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Contador pneumático"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>
          <rect
            x={20}
            y={22}
            width={128}
            height={76}
            className={activeBox(reached)}
            strokeWidth={1.8}
          />
          <rect
            x={38}
            y={36}
            width={92}
            height={26}
            className="fill-background stroke-steel"
            strokeWidth={1.4}
          />
          <text
            x={84}
            y={55}
            textAnchor="middle"
            className="fill-air font-mono text-[13px] font-semibold"
          >
            {String(Math.min(99999, Math.max(0, Math.round(count)))).padStart(5, "0")}
          </text>
          <text
            x={84}
            y={82}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[9px]"
          >
            pré {comp.preset ?? 1}
          </text>
          <path d="M0 40 H20" className={baseLine} strokeWidth={1.7} />
          <path d="M0 86 H20" className={baseLine} strokeWidth={1.7} />
          <path
            d="M148 40 H168"
            className={reached ? "fill-none stroke-air" : baseLine}
            strokeWidth={1.7}
          />
          <path d="M84 98 V120" className={baseLine} strokeWidth={1.7} />
          <PortNumber x={0} y={32} value="12" />
          <PortNumber x={0} y={78} value="10" />
          <PortNumber x={150} y={32} value="2" />
          <PortNumber x={86} y={112} value="1" />
        </svg>
      );
    }

    /*
     * Unidade de conservação — ISO 1219.
     *
     * Forma detalhada: três elementos em série dentro do invólucro tracejado.
     *  - Filtro: losango com a linha tracejada vertical (elemento filtrante)
     *    e o dreno em V pendurado no vértice de baixo.
     *  - Regulador: retângulo com a seta diagonal do ajuste, a mola de um lado
     *    e o manômetro (círculo com ponteiro) acima.
     *  - Lubrificador: losango com a linha tracejada e a gota no topo.
     *
     * O losango de filtro e de lubrificador é o mesmo símbolo base; o que os
     * distingue é o dreno (filtro) e a gota (lubrificador).
     */
    /*
     * Unidade de conservação COMPLETA — Quadro 5 da apostila.
     *
     * Envoltória tracejada contendo, da esquerda para a direita:
     *   (1) filtro com dreno — losango com linha tracejada vertical e a seta
     *       do dreno apontando para baixo;
     *   (2) válvula reguladora de pressão — corpo com mola e a seta inclinada
     *       da regulagem;
     *   (3) manômetro — círculo com ponteiro, derivado da linha;
     *   (4) lubrificador — losango com a gota no topo.
     * A linha de fluxo entra pela esquerda e sai pela direita.
     */
    case "lubrifil": {
      const flowing = live("A");
      const diamond = (cx: number, cy: number) =>
        `M${cx} ${cy - 18} L${cx + 20} ${cy} L${cx} ${cy + 18} L${cx - 20} ${cy} Z`;
      const numeral = (x: number, yy: number, value: string) => (
        <text x={x} y={yy} className="fill-muted-foreground font-mono text-[9px]">
          {value}
        </text>
      );
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Unidade de conservação completa: filtro, regulador, manômetro e lubrificador"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>

          {/* envoltória tracejada da unidade */}
          <rect
            x={14}
            y={20}
            width={200}
            height={82}
            className="fill-none stroke-steel"
            strokeWidth={1}
            strokeDasharray="5 4"
          />

          {/* linha de fluxo atravessando a unidade */}
          <path
            d="M0 52 H228"
            className={flowing ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />

          {/* (1) filtro com dreno */}
          <path d={diamond(46, 52)} className="fill-background stroke-steel" strokeWidth={1.6} />
          <path d="M46 34 V70" className={baseLine} strokeWidth={1.2} strokeDasharray="3 3" />
          <path d="M46 70 V88" className={baseLine} strokeWidth={1.3} />
          <path d="M41 81 L46 90 L51 81" className={baseLine} strokeWidth={1.3} fill="none" />
          {numeral(42, 32, "1")}

          {/* (2) válvula reguladora de pressão: corpo, mola e seta de regulagem */}
          <rect
            x={96}
            y={38}
            width={30}
            height={28}
            className="fill-background stroke-steel"
            strokeWidth={1.6}
          />
          <path d="M111 66 V80" className={baseLine} strokeWidth={1.2} />
          <path
            d="M105 70 L117 72 L105 75 L117 77"
            className={baseLine}
            strokeWidth={1.2}
            fill="none"
          />
          <path d="M92 70 L128 34" className={baseLine} strokeWidth={1.6} />
          <path d="M128 34 L118 36 M128 34 L126 44" className={baseLine} strokeWidth={1.4} />
          {numeral(98, 34, "2")}

          {/* (3) manômetro derivado da linha */}
          <path d="M154 52 V34" className={baseLine} strokeWidth={1.2} />
          <circle
            cx={154}
            cy={26}
            r={8}
            className="fill-background stroke-steel"
            strokeWidth={1.4}
          />
          <path d="M154 26 L159 21" className={baseLine} strokeWidth={1.2} />
          {numeral(164, 24, "3")}

          {/* (4) lubrificador */}
          <path d={diamond(190, 52)} className="fill-background stroke-steel" strokeWidth={1.6} />
          <path d="M190 34 V70" className={baseLine} strokeWidth={1.2} strokeDasharray="3 3" />
          <path
            d="M190 28 L195 38 A6 6 0 1 1 185 38 Z"
            className={baseLine}
            strokeWidth={1.3}
            fill="none"
          />
          {numeral(198, 70, "4")}

          <PortNumber x={2} y={44} value="1" />
          <PortNumber x={212} y={44} value="2" />
        </svg>
      );
    }

    /*
     * Unidade de conservação SIMPLIFICADA — Quadro 5 (imagem à direita).
     *
     * É o símbolo enxuto: um retângulo atravessado pela linha de fluxo, com
     * um LOSANGO inscrito (o conjunto filtro/regulador/lubrificador reunido)
     * e o MANÔMETRO no centro do losango. Sem dreno, sem tracejado e sem
     * numeração — todo o detalhamento fica na versão completa.
     */
    case "conservationUnit": {
      const flowing = live("A");
      return (
        <svg
          width={def.width}
          height={def.height}
          viewBox={`0 0 ${def.width} ${def.height}`}
          aria-label="Unidade de conservação simplificada"
        >
          {defs}
          <text x={4} y={13} className="fill-foreground font-mono text-[10px] font-semibold">
            {comp.label}
          </text>

          {/* linha de fluxo entrando e saindo */}
          <path
            d="M0 52 H120"
            className={flowing ? "fill-none stroke-air" : baseLine}
            strokeWidth={2}
          />

          {/* corpo: retângulo de traço contínuo */}
          <rect
            x={24}
            y={26}
            width={72}
            height={52}
            className={activeBox(flowing)}
            strokeWidth={1.8}
          />

          {/* losango inscrito */}
          <path
            d="M60 30 L92 52 L60 74 L28 52 Z"
            className="fill-none stroke-steel"
            strokeWidth={1.5}
          />

          {/* manômetro no centro */}
          <circle
            cx={60}
            cy={52}
            r={10}
            className="fill-background stroke-steel"
            strokeWidth={1.5}
          />
          <path d="M60 52 L66 46" className={baseLine} strokeWidth={1.3} />

          <PortNumber x={2} y={44} value="1" />
          <PortNumber x={104} y={44} value="2" />
        </svg>
      );
    }

    default:
      return null;
  }
}