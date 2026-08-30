import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Save, FolderOpen, Trash } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Canvas } from "@/components/simulator/Canvas";
import { Palette } from "@/components/simulator/Palette";
import { PropertiesPanel } from "@/components/simulator/PropertiesPanel";
import { CATALOG } from "@/lib/pneumatics/catalog";
import { basicCircuit, springReturnCircuit } from "@/lib/pneumatics/presets";
import { useSimulation } from "@/lib/pneumatics/useSimulation";
import type { Circuit, ComponentType, PlacedComponent } from "@/lib/pneumatics/types";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Bancada de simulação pneumática | Pneumatik Lab" },
      {
        name: "description",
        content:
          "Monte circuitos pneumáticos em grade, ligue mangueiras entre portas e veja o cilindro avançar em tempo real.",
      },
      { property: "og:title", content: "Bancada de simulação pneumática | Pneumatik Lab" },
      {
        property: "og:description",
        content:
          "Componentes, área de montagem em grade e painel de propriedades para praticar automação pneumática.",
      },
    ],
  }),
  component: SimulatorPage,
});

let counter = 0;
const nextId = (type: string) => `${type}-${Date.now().toString(36)}-${counter++}`;

function SimulatorPage() {
  const [circuit, setCircuit] = useState<Circuit>(() => basicCircuit());
  const [running, setRunning] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPort, setPendingPort] = useState<{ componentId: string; portId: string } | null>(
    null,
  );
  const { runtime, solved, setSignal, toggleSignal, reset } = useSimulation(circuit, running);

  const selected = useMemo(
    () => circuit.components.find((c) => c.id === selectedId) ?? null,
    [circuit, selectedId],
  );

  const addComponent = (type: ComponentType, x = 96, y = 96) => {
    const def = CATALOG[type];
    const id = nextId(type);
    const comp: PlacedComponent = {
      id,
      type,
      x,
      y,
      label: `${def.short} ${circuit.components.filter((c) => c.type === type).length + 1}`,
      momentary: type === "button" ? true : undefined,
      speed: type.startsWith("cylinder") ? 1 : undefined,
      trigger: type === "sensor" ? "extended" : undefined,
    };
    setCircuit((prev) => ({ ...prev, components: [...prev.components, comp] }));
    setSelectedId(id);
  };

  const moveComponent = (id: string, x: number, y: number) =>
    setCircuit((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, x, y } : c)),
    }));

  const patchSelected = (patch: Partial<PlacedComponent>) =>
    setCircuit((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === selectedId ? { ...c, ...patch } : c)),
    }));

  const deleteSelected = () => {
    if (!selectedId) return;
    setCircuit((prev) => ({
      components: prev.components
        .filter((c) => c.id !== selectedId)
        .map((c) => (c.actuatorId === selectedId ? { ...c, actuatorId: null } : c)),
      tubes: prev.tubes.filter(
        (t) => t.from.componentId !== selectedId && t.to.componentId !== selectedId,
      ),
    }));
    setSelectedId(null);
  };

  const handlePortClick = (componentId: string, portId: string) => {
    if (!pendingPort) {
      setPendingPort({ componentId, portId });
      return;
    }
    if (pendingPort.componentId === componentId && pendingPort.portId === portId) {
      setPendingPort(null);
      return;
    }
    setCircuit((prev) => ({
      ...prev,
      tubes: [
        ...prev.tubes.filter(
          (t) =>
            !(
              (t.from.componentId === componentId && t.from.portId === portId) ||
              (t.to.componentId === componentId && t.to.portId === portId)
            ) || true,
        ),
        { id: nextId("tube"), from: pendingPort, to: { componentId, portId } },
      ],
    }));
    setPendingPort(null);
  };

  const loadPreset = (preset: Circuit) => {
    setCircuit(preset);
    setSelectedId(null);
    setPendingPort(null);
    reset();
  };

  const activeCylinders = circuit.components.filter((c) => c.type.startsWith("cylinder"));

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader />

      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          className="flex items-center gap-2 rounded-sm bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pausar" : "Simular"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          <RotateCcw className="size-4" /> Reiniciar
        </button>
        <button
          type="button"
          onClick={() => loadPreset(basicCircuit())}
          className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Exemplo dupla ação
        </button>
        <button
          type="button"
          onClick={() => loadPreset(springReturnCircuit())}
          className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Exemplo simples ação
        </button>
        <button
          type="button"
          onClick={() => loadPreset({ components: [], tubes: [] })}
          className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          <Trash className="size-4" /> Limpar
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled
            title="Salvamento de projetos em preparação"
            className="flex cursor-not-allowed items-center gap-2 rounded-sm border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground"
          >
            <Save className="size-4" /> Salvar projeto
          </button>
          <button
            type="button"
            disabled
            title="Biblioteca de projetos em preparação"
            className="flex cursor-not-allowed items-center gap-2 rounded-sm border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground"
          >
            <FolderOpen className="size-4" /> Meus projetos
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:block">
          <Palette onAdd={(type) => addComponent(type)} />
        </aside>

        <main className="relative min-w-0 flex-1">
          <Canvas
            circuit={circuit}
            runtime={runtime}
            solved={solved}
            selectedId={selectedId}
            pendingPort={pendingPort}
            onSelect={setSelectedId}
            onMove={moveComponent}
            onPortClick={handlePortClick}
            onSignalDown={(comp) =>
              comp.momentary ? setSignal(comp.id, true) : toggleSignal(comp.id)
            }
            onSignalUp={(comp) => comp.momentary && setSignal(comp.id, false)}
            onDropComponent={(type, x, y) => addComponent(type as ComponentType, x, y)}
          />
          {pendingPort && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm border border-primary bg-surface px-3 py-1.5 text-xs">
              Selecione a porta de destino para concluir a mangueira
            </div>
          )}
        </main>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-sidebar xl:block">
          <PropertiesPanel
            circuit={circuit}
            selected={selected}
            runtime={runtime}
            onChange={patchSelected}
            onDelete={deleteSelected}
          />
          <div className="border-t border-border p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Monitor
            </h3>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span>{running ? "executando" : "pausado"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Componentes</span>
                <span>{circuit.components.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Mangueiras</span>
                <span>{circuit.tubes.length}</span>
              </li>
              {activeCylinders.map((cyl) => (
                <li key={cyl.id} className="flex justify-between">
                  <span className="text-muted-foreground">{cyl.label}</span>
                  <span>{Math.round((runtime.strokes[cyl.id] ?? 0) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
