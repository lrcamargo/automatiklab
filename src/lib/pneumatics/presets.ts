import type { Circuit } from "./types";

/*
 * Os circuitos de exemplo seguem o traçado usado na apostila:
 *
 *   - o atuador fica no topo, com as linhas de trabalho descendo até a
 *     válvula direcional;
 *   - a válvula direcional fica no meio, com as linhas de pilotagem saindo
 *     para os DOIS lados;
 *   - as válvulas de comando ficam à esquerda e à direita, na mesma altura,
 *     alimentando cada uma o seu piloto;
 *   - a linha de alimentação é um barramento horizontal na parte de baixo,
 *     do qual derivam a direcional e os dois comandos;
 *   - a unidade de preparação e a fonte de ar ficam junto à extremidade
 *     esquerda desse barramento, próximas ao corpo do diagrama (um pouco
 *     abaixo dele, para não afastar o desenho).
 *
 * A constante abaixo é a altura desse barramento; todas as mangueiras de
 * alimentação usam esse mesmo `midY` para desenhar uma linha única.
 */
const SUPPLY_RAIL_Y = 560;

/** Altura das linhas de pilotagem que atravessam o desenho. */
const PILOT_RAIL_Y = 320;

/**
 * Circuito didático de dupla ação: dois comandos 3/2 pilotam uma 5/2 de dupla
 * pilotagem, que por sua vez comanda o cilindro de dupla ação.
 */
export function basicCircuit(): Circuit {
  return {
    components: [
      // atuador no topo
      {
        id: "cil1",
        type: "cylinderDouble",
        x: 120,
        y: 0,
        label: "1A1",
        speed: 0.8,
      },
      // direcional no meio, pilotada dos dois lados
      {
        id: "v1",
        type: "valve52",
        x: 120,
        y: 220,
        label: "1V1",
        actuation: "pilotoSimples",
        returnType: "pilotoSimples",
      },
      // comandos à esquerda e à direita
      {
        id: "s1",
        type: "valve32",
        actuation: "botao",
        returnType: "mola",
        x: -200,
        y: 380,
        label: "1S1",
        momentary: true,
      },
      {
        id: "s2",
        type: "valve32",
        actuation: "botao",
        returnType: "mola",
        x: 420,
        y: 380,
        label: "1S2",
        momentary: true,
      },
      // preparação e fonte na ponta esquerda do barramento
      {
        id: "z1",
        type: "conservationUnit",
        x: -290,
        y: 604,
        label: "0Z1",
      },
      { id: "src1", type: "source", x: -470, y: 610, label: "1P1", pressure: 6 },
    ],
    tubes: [
      // fonte -> unidade de preparação
      {
        id: "t1",
        medium: "pneumatic",
        from: { componentId: "src1", portId: "P" },
        to: { componentId: "z1", portId: "P" },
        midY: SUPPLY_RAIL_Y,
      },
      // barramento de alimentação: unidade -> direcional -> comandos
      {
        id: "t2",
        medium: "pneumatic",
        from: { componentId: "z1", portId: "A" },
        to: { componentId: "v1", portId: "P" },
        midY: SUPPLY_RAIL_Y,
      },
      {
        id: "t3",
        medium: "pneumatic",
        from: { componentId: "z1", portId: "A" },
        to: { componentId: "s1", portId: "P" },
        midY: SUPPLY_RAIL_Y,
      },
      {
        id: "t4",
        medium: "pneumatic",
        from: { componentId: "v1", portId: "P" },
        to: { componentId: "s2", portId: "P" },
        midY: SUPPLY_RAIL_Y,
      },
      // linhas de pilotagem para os dois lados da direcional
      {
        id: "t5",
        medium: "pneumatic",
        from: { componentId: "s1", portId: "A" },
        to: { componentId: "v1", portId: "14" },
        midY: PILOT_RAIL_Y,
      },
      {
        id: "t6",
        medium: "pneumatic",
        from: { componentId: "s2", portId: "A" },
        to: { componentId: "v1", portId: "12" },
        midY: PILOT_RAIL_Y,
      },
      // linhas de trabalho subindo até o cilindro
      {
        id: "t7",
        medium: "pneumatic",
        from: { componentId: "v1", portId: "A" },
        to: { componentId: "cil1", portId: "A" },
        midY: 160,
      },
      {
        id: "t8",
        medium: "pneumatic",
        from: { componentId: "v1", portId: "B" },
        to: { componentId: "cil1", portId: "B" },
        midY: 140,
      },
    ],
  };
}

/**
 * Circuito de simples ação: um comando 3/2 pilota a direcional 3/2, que
 * alimenta o cilindro de simples ação com retorno por mola.
 */
export function springReturnCircuit(): Circuit {
  return {
    components: [
      {
        id: "cil1",
        type: "cylinderSingle",
        x: 120,
        y: 0,
        label: "1A1",
        speed: 1,
      },
      {
        id: "v1",
        type: "valve32",
        x: 120,
        y: 220,
        label: "1V1",
        actuation: "pilotoSimples",
        returnType: "mola",
      },
      {
        id: "s1",
        type: "valve32",
        actuation: "botao",
        returnType: "mola",
        x: -200,
        y: 380,
        label: "1S1",
        momentary: true,
      },
      {
        id: "z1",
        type: "conservationUnit",
        x: -290,
        y: 604,
        label: "0Z1",
      },
      { id: "src1", type: "source", x: -470, y: 610, label: "1P1", pressure: 6 },
    ],
    tubes: [
      {
        id: "t1",
        medium: "pneumatic",
        from: { componentId: "src1", portId: "P" },
        to: { componentId: "z1", portId: "P" },
        midY: SUPPLY_RAIL_Y,
      },
      {
        id: "t2",
        medium: "pneumatic",
        from: { componentId: "z1", portId: "A" },
        to: { componentId: "v1", portId: "P" },
        midY: SUPPLY_RAIL_Y,
      },
      {
        id: "t3",
        medium: "pneumatic",
        from: { componentId: "z1", portId: "A" },
        to: { componentId: "s1", portId: "P" },
        midY: SUPPLY_RAIL_Y,
      },
      {
        id: "t4",
        medium: "pneumatic",
        from: { componentId: "s1", portId: "A" },
        to: { componentId: "v1", portId: "14" },
        midY: PILOT_RAIL_Y,
      },
      {
        id: "t5",
        medium: "pneumatic",
        from: { componentId: "v1", portId: "A" },
        to: { componentId: "cil1", portId: "A" },
        midY: 160,
      },
    ],
  };
}