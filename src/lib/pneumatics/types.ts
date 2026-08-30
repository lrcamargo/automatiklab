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
}

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
