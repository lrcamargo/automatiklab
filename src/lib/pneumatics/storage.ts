import { z } from "zod";
import { CATALOG } from "./catalog";
import { sanitizeCircuit } from "./circuit";
import type { Circuit } from "./types";

/**
 * Persistência local dos circuitos.
 *
 * Os projetos ficam em `localStorage` sob uma única chave, num envelope com
 * versão. Tudo que entra passa por um esquema zod antes de virar `Circuit`:
 * o conteúdo do `localStorage` é entrada não confiável — pode ter sido
 * editado à mão, exportado de uma versão antiga ou corrompido — e um objeto
 * malformado chegando ao motor quebraria a bancada inteira.
 */

const STORAGE_KEY = "automatiklab.projects.v1";

/** Versão do formato gravado. Serve para migrações futuras. */
export const STORAGE_VERSION = 1;

const componentTypeSchema = z.enum(
  Object.keys(CATALOG) as [keyof typeof CATALOG, ...(keyof typeof CATALOG)[]],
);

const actuationSchema = z.enum([
  "manual",
  "botao",
  "alavanca",
  "pedal",
  "mola",
  "centragemMolas",
  "came",
  "rolete",
  "roleteEscamoteavel",
  "pilotoSimples",
  "pilotoDuplo",
  "servoPilotoSimples",
  "servoPilotoDuplo",
  "solenoideSimples",
  "solenoideDuplo",
  "solenoideProporcional",
  "servoSolenoideDuploManual",
]);

const componentSchema = z.object({
  id: z.string().min(1),
  type: componentTypeSchema,
  x: z.number().finite(),
  y: z.number().finite(),
  label: z.string(),
  momentary: z.boolean().optional(),
  speed: z.number().finite().optional(),
  targetId: z.string().nullable().optional(),
  trigger: z.enum(["extended", "retracted"]).optional(),
  pressure: z.number().finite().optional(),
  actuation: actuationSchema.optional(),
  returnType: actuationSchema.optional(),
  delay: z.number().finite().optional(),
  restriction: z.number().finite().optional(),
  preset: z.number().int().min(1).max(99999).optional(),
  springAction: z.enum(["retornoMola", "avancoMola"]).optional(),
  throughRod: z.boolean().optional(),
  cushioning: z.enum(["nenhum", "fixo", "regulavel"]).optional(),
  rotation: z.number().finite().optional(),
});

const endpointSchema = z.object({
  componentId: z.string().min(1),
  portId: z.string().min(1),
});

const tubeSchema = z.object({
  id: z.string().min(1),
  medium: z.literal("pneumatic"),
  from: endpointSchema,
  to: endpointSchema,
  midY: z.number().finite().optional(),
  midX: z.number().finite().optional(),
});

export const circuitSchema = z.object({
  components: z.array(componentSchema),
  tubes: z.array(tubeSchema),
});

/**
 * O projeto compila com `exactOptionalPropertyTypes`, então um campo opcional
 * precisa estar ausente e não presente com `undefined`. O zod devolve as
 * chaves opcionais explicitamente, por isso removemos as indefinidas antes de
 * entregar o objeto como `Circuit`.
 */
function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function toCircuit(parsed: z.infer<typeof circuitSchema>): Circuit {
  return {
    components: parsed.components.map((component) => stripUndefined(component)),
    tubes: parsed.tubes.map((tube) => stripUndefined(tube)),
  } as Circuit;
}

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  createdAt: z.string(),
  updatedAt: z.string(),
  circuit: circuitSchema,
});

/*
 * O envelope valida a casca, não cada projeto: a lista entra como `unknown[]`
 * e cada item é validado isoladamente em `loadProjects`. Se o array inteiro
 * fosse tipado aqui, um único projeto corrompido invalidaria o envelope e
 * apagaria da vista todos os projetos bons do usuário.
 */
const envelopeSchema = z.object({
  version: z.number().int(),
  projects: z.array(z.unknown()),
});

/**
 * Projeto pronto para uso na bancada: igual ao esquema, mas com o circuito já
 * normalizado para `Circuit` (sem chaves opcionais presentes como `undefined`).
 */
export interface StoredProject extends Omit<z.infer<typeof projectSchema>, "circuit"> {
  circuit: Circuit;
}

/** Resumo para listagem, sem carregar o circuito inteiro na tela. */
export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  componentCount: number;
  tubeCount: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Lê o envelope. Qualquer falha — chave ausente, JSON inválido, esquema
 * incompatível — devolve lista vazia em vez de lançar: um projeto corrompido
 * não pode impedir o simulador de abrir.
 */
export function loadProjects(): StoredProject[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = envelopeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    // descarta individualmente projetos cujo circuito não valida
    return parsed.data.projects.flatMap((entry) => {
      const project = projectSchema.safeParse(entry);
      if (!project.success) return [];
      return [{ ...project.data, circuit: toCircuit(project.data.circuit) }];
    });
  } catch {
    return [];
  }
}

function persist(projects: StoredProject[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, projects }));
}

export function listProjects(): ProjectSummary[] {
  return loadProjects()
    .map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      componentCount: project.circuit.components.length,
      tubeCount: project.circuit.tubes.length,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function newId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Grava um circuito. Com `id` sobrescreve o projeto correspondente mantendo a
 * data de criação; sem `id`, cria um novo. Devolve o projeto gravado.
 */
export function saveProject(name: string, circuit: Circuit, id?: string): StoredProject {
  const projects = loadProjects();
  const now = new Date().toISOString();
  const clean = sanitizeCircuit(circuit);
  const existing = id ? projects.find((project) => project.id === id) : undefined;
  const saved: StoredProject = {
    id: existing?.id ?? newId(),
    name: name.trim() || "Sem título",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    circuit: clean,
  };
  const next = existing
    ? projects.map((project) => (project.id === saved.id ? saved : project))
    : [...projects, saved];
  persist(next);
  return saved;
}

export function deleteProject(id: string): void {
  persist(loadProjects().filter((project) => project.id !== id));
}

export function renameProject(id: string, name: string): void {
  const now = new Date().toISOString();
  persist(
    loadProjects().map((project) =>
      project.id === id
        ? { ...project, name: name.trim() || project.name, updatedAt: now }
        : project,
    ),
  );
}

export function getProject(id: string): StoredProject | null {
  return loadProjects().find((project) => project.id === id) ?? null;
}

/** Serializa um circuito para download em `.json`. */
export function exportProject(name: string, circuit: Circuit): string {
  return JSON.stringify(
    { version: STORAGE_VERSION, name, circuit: sanitizeCircuit(circuit) },
    null,
    2,
  );
}

const importSchema = z.object({
  version: z.number().int().optional(),
  name: z.string().optional(),
  circuit: circuitSchema,
});

/**
 * Lê um `.json` exportado. Aceita tanto o envelope completo quanto um circuito
 * solto, e devolve um erro legível em vez de lançar.
 */
export function importProject(
  text: string,
): { ok: true; name: string; circuit: Circuit } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "O arquivo não é um JSON válido." };
  }
  const wrapped = importSchema.safeParse(data);
  if (wrapped.success) {
    return {
      ok: true,
      name: wrapped.data.name ?? "Circuito importado",
      circuit: sanitizeCircuit(toCircuit(wrapped.data.circuit)),
    };
  }
  const bare = circuitSchema.safeParse(data);
  if (bare.success) {
    return { ok: true, name: "Circuito importado", circuit: sanitizeCircuit(toCircuit(bare.data)) };
  }
  return { ok: false, error: "O arquivo não contém um circuito reconhecível." };
}