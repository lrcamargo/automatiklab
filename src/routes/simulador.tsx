import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Save, FolderOpen, Trash, Printer } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Canvas } from "@/components/simulator/Canvas";
import { Palette } from "@/components/simulator/Palette";
import { PropertiesPanel } from "@/components/simulator/PropertiesPanel";
import { TechnicalDiagram } from "@/components/simulator/TechnicalDiagram";
import { Button } from "@/components/ui/button";
import { CATALOG } from "@/lib/pneumatics/catalog";
import { basicCircuit, springReturnCircuit } from "@/lib/pneumatics/presets";
import { useSimulation } from "@/lib/pneumatics/useSimulation";
import { strokeDirection } from "@/lib/pneumatics/engine";
import type { Circuit, ComponentType, PlacedComponent } from "@/lib/pneumatics/types";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Bancada de simulação pneumática | AutoMatikLab" },
      {
        name: "description",
        content:
          "Monte circuitos pneumáticos em grade, ligue mangueiras entre portas e veja o cilindro avançar em tempo real.",
      },
      { property: "og:title", content: "Bancada de simulação pneumática | AutoMatikLab" },
      {
        property: "og:description",
        content:
          "Componentes, área de montagem em grade e painel de propriedades para praticar automação pneumática.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulatorPage,
});

let counter = 0;
const nextId = (type: string) => `${type}-${Date.now().toString(36)}-${counter++}`;
const TECHNICAL_PREFIX: Record<ComponentType, string> = {
  source: "1P",
  valve32: "1V",
  valve52: "1V",
  cylinderSingle: "1A",
  cylinderDouble: "1A",
  button: "1S",
  sensor: "1S",
};

function SimulatorPage() {
  const [circuit, setCircuit] = useState<Circuit>(() => basicCircuit());
  const [running, setRunning] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPort, setPendingPort] = useState<{ componentId: string; portId: string } | null>(
    null,
  );
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const blockedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { runtime, solved, setSignal, toggleSignal, setStroke, reset } = useSimulation(
    circuit,
    running,
  );

  const flagBlocked = (id: string) => {
    setBlockedId(id);
    if (blockedTimer.current) clearTimeout(blockedTimer.current);
    blockedTimer.current = setTimeout(() => setBlockedId(null), 900);
  };

  /** clique direto no símbolo: comuta válvulas e atua cilindros sem burlar a pressão */
  const activateComponent = (comp: PlacedComponent) => {
    setSelectedId(comp.id);
    if (comp.type === "valve32" || comp.type === "valve52") {
      toggleSignal(comp.id);
      return;
    }
    if (comp.type === "button") {
      if (comp.momentary) {
        setSignal(comp.id, true);
        setTimeout(() => setSignal(comp.id, false), 700);
      } else {
        toggleSignal(comp.id);
      }
      return;
    }
    if (comp.type === "cylinderSingle" || comp.type === "cylinderDouble") {
      const direction = strokeDirection(comp, solved);
      if (direction === 0) {
        flagBlocked(comp.id);
        return;
      }
      setStroke(comp.id, direction > 0 ? 1 : 0);
    }
  };

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
      label: `${TECHNICAL_PREFIX[type]}${circuit.components.filter((c) => c.type === type).length + 1}`,
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
    const from = pendingPort;
    setCircuit((prev) => ({
      ...prev,
      tubes: [...prev.tubes, { id: nextId("tube"), from, to: { componentId, portId } }],
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

  const printTechnicalDiagram = () => {
    setSelectedId(null);
    setPendingPort(null);
    window.setTimeout(() => window.print(), 80);
  };

  return (
    <div className="simulator-page flex h-screen flex-col overflow-hidden">
      <div className="editor-only"><SiteHeader /></div>

      <div className="editor-only flex items-center gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-2">
        <span className="shrink-0 font-mono text-[10px] font-semibold uppercase text-primary">Modo editor</span>
        <Button
          type="button"
          onClick={() => setRunning((v) => !v)}
          size="sm"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pausar" : "Simular"}
        </Button>
        <Button
          type="button"
          onClick={reset}
          variant="outline" size="sm"
        >
          <RotateCcw className="size-4" /> Reiniciar
        </Button>
        <Button
          type="button"
          onClick={() => loadPreset(basicCircuit())}
          variant="outline" size="sm"
        >
          Exemplo dupla ação
        </Button>
        <Button
          type="button"
          onClick={() => loadPreset(springReturnCircuit())}
          variant="outline" size="sm"
        >
          Exemplo simples ação
        </Button>
        <Button
          type="button"
          onClick={() => loadPreset({ components: [], tubes: [] })}
          variant="outline" size="sm"
        >
          <Trash className="size-4" /> Limpar
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            onClick={printTechnicalDiagram}
            variant="secondary"
            size="sm"
            title="Abrir a impressão limpa; escolha Salvar como PDF para exportar"
          >
            <Printer className="size-4" /> Imprimir / Exportar
          </Button>
          <Button
            type="button"
            disabled
            title="Salvamento de projetos em preparação"
            variant="outline" size="sm" className="border-dashed"
          >
            <Save className="size-4" /> Salvar projeto
          </Button>
          <Button
            type="button"
            disabled
            title="Biblioteca de projetos em preparação"
            variant="outline" size="sm" className="border-dashed"
          >
            <FolderOpen className="size-4" /> Meus projetos
          </Button>
        </div>
      </div>

      <div className="editor-only flex min-h-0 flex-1">
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
            onActivate={activateComponent}
            blockedId={blockedId}
            onDropComponent={(type, x, y) => addComponent(type as ComponentType, x, y)}
          />
          {blockedId && (
            <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 rounded-sm border border-destructive bg-surface px-3 py-1.5 text-xs">
              Sem pressão válida nesta porta: verifique a alimentação pela porta 1 e as conexões
            </div>
          )}
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
      <TechnicalDiagram circuit={circuit} runtime={runtime} solved={solved} />
    </div>
  );
}
