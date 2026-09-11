export type ComponentType =
  | "source"
  | "valve32"
  | "valve52"
  | "cylinderSingle"
  | "cylinderDouble"
  | "button"
  | "sensor";

export interface PortDef {
  id: string;
  label: string;
  /** posição em px relativa ao canto superior esquerdo do componente */
  x: number;
  y: number;
  kind: "supply" | "work" | "exhaust";
}

export interface ComponentDef {
  type: ComponentType;
  name: string;
  short: string;
  description: string;
  family: "alimentacao" | "comando" | "atuacao" | "sinal";
  width: number;
  height: number;
  ports: PortDef[];
}

export interface PlacedComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label: string;
  /** id do componente de sinal (botão/sensor) que aciona esta válvula */
  actuatorId?: string | null | undefined;
  /** botão: momentâneo ou trava */
  momentary?: boolean | undefined;
  /** cilindro: velocidade relativa de avanço (0.2 – 2) */
  speed?: number | undefined;
  /** sensor: cilindro observado e posição de disparo */
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
  | "piloto"
  | "servoPiloto"
  | "solenoide"
  | "solenoideManual"
  | "servoSolenoide";

export const ACTUATIONS: { id: ActuationType; label: string; group: string }[] = [
  { id: "manual", label: "Manual — geral", group: "Manual" },
  { id: "botao", label: "Manual — botão", group: "Manual" },
  { id: "alavanca", label: "Manual — alavanca", group: "Manual" },
  { id: "pedal", label: "Manual — pedal", group: "Manual" },
  { id: "came", label: "Mecânico — came / apalpador", group: "Mecânico" },
  { id: "rolete", label: "Mecânico — rolete", group: "Mecânico" },
  { id: "roleteEscamoteavel", label: "Mecânico — rolete escamoteável", group: "Mecânico" },
  { id: "mola", label: "Mecânico — mola", group: "Mecânico" },
  { id: "centragemMolas", label: "Mecânico — centragem por molas", group: "Mecânico" },
  { id: "piloto", label: "Pneumático — piloto", group: "Pneumático" },
  { id: "servoPiloto", label: "Pneumático — servo-piloto", group: "Pneumático" },
  { id: "solenoide", label: "Elétrico — solenoide", group: "Elétrico" },
  { id: "solenoideManual", label: "Elétrico — solenoide com manual", group: "Elétrico" },
  { id: "servoSolenoide", label: "Elétrico — servo-solenoide", group: "Elétrico" },
];

export const ACTUATION_GROUPS = ["Manual", "Mecânico", "Pneumático", "Elétrico"];


export interface Tube {
  id: string;
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
  /** botões pressionados / travados */
  signals: Record<string, boolean>;
}

export interface SolveResult {
  pressurized: Set<string>;
  actuated: Record<string, boolean>;
}

export const portKey = (componentId: string, portId: string) => `${componentId}:${portId}`;
