export type ComponentType =
  | "source"
  | "valve32"
  | "valve52"
  | "cylinderSingle"
  | "cylinderDouble"
  | "button"
  | "sensor";

export type PortDomain = "pneumatic";
export type PortKind = "supply" | "work" | "exhaust" | "control";

export interface PortDef {
  id: string;
  label: string;
  /** posição em px relativa ao canto superior esquerdo do componente */
  x: number;
  y: number;
  kind: PortKind;
  domain: PortDomain;
}

export interface ComponentDef {
  type: ComponentType;
  name: string;
  short: string;
  description: string;
  family: "alimentacao" | "comando" | "atuacao" | "sinal";
  width: number;
  height: number;
  /** portas funcionais fixas; portas de piloto são calculadas pela configuração */
  ports: PortDef[];
}

export interface PlacedComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label: string;
  /** botão pneumático: momentâneo ou trava */
  momentary?: boolean | undefined;
  /** cilindro: velocidade relativa de avanço (0.2 – 2) */
  speed?: number | undefined;
  /** fim de curso: cilindro observado e posição de disparo */
  targetId?: string | null | undefined;
  trigger?: "extended" | "retracted" | undefined;
  /** fonte: pressão de alimentação em bar */
  pressure?: number | undefined;
  /** válvula: tipo de acionamento do lado esquerdo */
  actuation?: ActuationType | undefined;
  /** válvula: tipo de retorno / acionamento do lado direito */
  returnType?: ActuationType | undefined;
}

export type ActuationType =
  | "manual"
  | "botao"
  | "alavanca"
  | "pedal"
  | "came"
  | "rolete"
  | "roleteEscamoteavel"
  | "mola"
  | "centragemMolas"
  | "pilotoSimples"
  | "pilotoDuplo"
  | "servoPilotoSimples"
  | "servoPilotoDuplo"
  | "solenoideSimples"
  | "solenoideDuplo"
  | "servoSolenoideDuploManual";

export const ACTUATIONS: { id: ActuationType; label: string; group: string }[] = [
  { id: "manual", label: "Manual — geral", group: "Manual" },
  { id: "botao", label: "Manual — botão", group: "Manual" },
  { id: "alavanca", label: "Manual — alavanca", group: "Manual" },
  { id: "pedal", label: "Manual — pedal", group: "Manual" },
  { id: "came", label: "Mecânico — came / apalpador", group: "Mecânico" },
  { id: "rolete", label: "Mecânico — rolete", group: "Mecânico" },
  {
    id: "roleteEscamoteavel",
    label: "Mecânico — rolete escamoteável",
    group: "Mecânico",
  },
  { id: "mola", label: "Mecânico — mola", group: "Mecânico" },
  {
    id: "centragemMolas",
    label: "Mecânico — centragem por molas",
    group: "Mecânico",
  },
  {
    id: "pilotoSimples",
    label: "Pneumático — piloto simples",
    group: "Pneumático",
  },
  { id: "pilotoDuplo", label: "Pneumático — piloto duplo", group: "Pneumático" },
  {
    id: "servoPilotoSimples",
    label: "Pneumático — servo-piloto simples",
    group: "Pneumático",
  },
  {
    id: "servoPilotoDuplo",
    label: "Pneumático — servo-piloto duplo",
    group: "Pneumático",
  },
  {
    id: "solenoideSimples",
    label: "Elétrico — solenoide simples",
    group: "Elétrico",
  },
  { id: "solenoideDuplo", label: "Elétrico — solenoide duplo", group: "Elétrico" },
  {
    id: "servoSolenoideDuploManual",
    label: "Combinado — duplo servo-solenoide com manual",
    group: "Combinado",
  },
];

export const ACTUATION_GROUPS = [
  "Manual",
  "Mecânico",
  "Pneumático",
  "Elétrico",
  "Combinado",
];

export interface Tube {
  id: string;
  medium: PortDomain;
  from: { componentId: string; portId: string };
  to: { componentId: string; portId: string };
}

export interface Circuit {
  components: PlacedComponent[];
  tubes: Tube[];
}

/** estado dinâmico calculado a cada quadro */
export interface RuntimeState {
  /** posição 0 (recuado) a 1 (avançado) por cilindro */
  strokes: Record<string, number>;
  /** comandos manuais pressionados / travados */
  signals: Record<string, boolean>;
  /** memória da última posição estável das válvulas */
  valvePositions: Record<string, boolean>;
}

export interface SolveResult {
  /** nós alimentados por uma fonte e não ligados simultaneamente ao escape */
  pressurized: Set<string>;
  /** nós com caminho aberto até a atmosfera */
  vented: Set<string>;
  /** nós que ligam alimentação diretamente ao escape */
  conflicts: Set<string>;
  /** posição comutada de cada válvula direcional principal */
  actuated: Record<string, boolean>;
}

export const portKey = (componentId: string, portId: string) =>
  `${componentId}:${portId}`;
