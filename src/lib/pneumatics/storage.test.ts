import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteProject,
  exportProject,
  getProject,
  importProject,
  listProjects,
  renameProject,
  saveProject,
} from "./storage";
import type { Circuit } from "./types";

const STORAGE_KEY = "automatiklab.projects.v1";

/**
 * Os testes rodam em Node, sem DOM. O módulo só precisa de `window.localStorage`
 * com a API síncrona padrão, então um Map basta e evita puxar jsdom só por isso.
 */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

const storage = new MemoryStorage();
globalThis.localStorage = storage;
(globalThis as { window?: unknown }).window = { localStorage: storage };

function circuit(): Circuit {
  return {
    components: [
      { id: "c1", type: "source", x: 0, y: 0, label: "0Z1", pressure: 6 },
      { id: "c2", type: "cylinderSingle", x: 300, y: 0, label: "1A1", speed: 1 },
    ],
    tubes: [
      {
        id: "t1",
        medium: "pneumatic",
        from: { componentId: "c1", portId: "P" },
        to: { componentId: "c2", portId: "A" },
      },
    ],
  };
}

describe("persistência local", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("grava e relê um projeto", () => {
    const saved = saveProject("Comando direto", circuit());
    const loaded = getProject(saved.id);
    expect(loaded?.name).toBe("Comando direto");
    expect(loaded?.circuit.components).toHaveLength(2);
    expect(loaded?.circuit.tubes).toHaveLength(1);
  });

  it("sobrescreve o mesmo projeto e mantém a data de criação", () => {
    const first = saveProject("Projeto", circuit());
    const second = saveProject("Projeto", { components: [], tubes: [] }, first.id);
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(listProjects()).toHaveLength(1);
    expect(getProject(first.id)?.circuit.components).toHaveLength(0);
  });

  it("renomeia e exclui", () => {
    const saved = saveProject("Antigo", circuit());
    renameProject(saved.id, "Novo");
    expect(getProject(saved.id)?.name).toBe("Novo");
    deleteProject(saved.id);
    expect(getProject(saved.id)).toBeNull();
    expect(listProjects()).toHaveLength(0);
  });

  it("descarta mangueiras órfãs ao salvar", () => {
    const broken = circuit();
    broken.tubes.push({
      id: "t2",
      medium: "pneumatic",
      from: { componentId: "inexistente", portId: "P" },
      to: { componentId: "c2", portId: "A" },
    });
    const saved = saveProject("Com órfã", broken);
    expect(saved.circuit.tubes).toHaveLength(1);
  });

  it("ignora conteúdo corrompido em vez de quebrar", () => {
    localStorage.setItem(STORAGE_KEY, "{ isto não é json");
    expect(listProjects()).toEqual([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, projects: "nada" }));
    expect(listProjects()).toEqual([]);
  });

  it("descarta um projeto inválido sem perder os válidos", () => {
    const good = saveProject("Bom", circuit());
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    raw.projects.push({
      id: "ruim",
      name: "Ruim",
      createdAt: "x",
      updatedAt: "x",
      circuit: {
        components: [{ id: "c", type: "inexistente", x: 0, y: 0, label: "L" }],
        tubes: [],
      },
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    const list = listProjects();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(good.id);
  });

  it("exporta e reimporta o mesmo circuito", () => {
    const text = exportProject("Ciclo único", circuit());
    const result = importProject(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.name).toBe("Ciclo único");
      expect(result.circuit.components).toHaveLength(2);
    }
  });

  it("aceita um circuito exportado sem envelope", () => {
    const result = importProject(JSON.stringify(circuit()));
    expect(result.ok).toBe(true);
  });

  it("recusa um arquivo que não é circuito", () => {
    expect(importProject("não é json").ok).toBe(false);
    expect(importProject(JSON.stringify({ foo: 1 })).ok).toBe(false);
  });
});