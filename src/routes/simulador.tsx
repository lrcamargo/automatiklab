import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Save, FolderOpen, Trash, Printer } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Canvas } from "@/components/simulator/Canvas";
import { Palette } from "@/components/simulator/Palette";
import { PropertiesPanel } from "@/components/simulator/PropertiesPanel";
import { TechnicalDiagram } from "@/components/simulator/TechnicalDiagram";
import { ProjectsDialog } from "@/components/simulator/ProjectsDialog";
import { Button } from "@/components/ui/button";
import { CATALOG, hasPneumaticPilot } from "@/lib/pneumatics/catalog";
import {
  countAttachedTubes,
  nextTechnicalLabel,
  removeComponent,
  removeTube,
  sanitizeCircuit,
  validateConnection,
} from "@/lib/pneumatics/circuit";
import { basicCircuit, springReturnCircuit } from "@/lib/pneumatics/presets";
import { saveProject } from "@/lib/pneumatics/storage";
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
function SimulatorPage() {
  const [circuit, setCircuit] = useState<Circuit>(() => basicCircuit());
  const [running, setRunning] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTubeId, setSelectedTubeId] = useState<string | null>(null);
  const [pendingPort, setPendingPort] = useState<{ componentId: string; portId: string } | null>(
    null,
  );
  const [blockedId, setBlockedId] = useState<string | null>(null);
  /** projeto aberto: nome exibido e id gravado (vazio enquanto nunca foi salvo) */
  const [projectName, setProjectName] = useState("Circuito sem título");
  const [projectId, setProjectId] = useState("");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const blockedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { runtime, solved, setSignal, toggleSignal, setStroke, reset } = useSimulation(
    circuit,
    running,
  );

  const flagBlocked = (id: string) => {
    setBlockedId(id);
    if (blockedTimer.current) clearTimeout(blockedTimer.current);
    blockedTimer.current = setTimeout(() => setBlockedId(null), 900);
  };

  const showMessage = (message: string) => {
    setConnectionMessage(message);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setConnectionMessage(null), 2600);
  };

  /** clique direto no símbolo: respeita o tipo de acionamento configurado */
  const activateComponent = (comp: PlacedComponent) => {
    setSelectedId(comp.id);
    if (comp.type === "valve32" || comp.type === "valve52") {
      if (hasPneumaticPilot(comp.actuation)) {
        flagBlocked(comp.id);
        showMessage("Esta válvula deve ser comandada pela porta piloto 14.");
        return;
      }
      if (comp.actuation?.startsWith("solenoide") || comp.actuation?.startsWith("servoSolenoide")) {
        flagBlocked(comp.id);
        showMessage("O comando elétrico será habilitado no módulo de eletropneumática.");
        return;
      }
      if (comp.actuation === "botao" && comp.returnType === "mola") {
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
    if (running) {
      showMessage("Pause a simulação para montar o circuito.");
      return;
    }
    const def = CATALOG[type];
    const id = nextId(type);
    const comp: PlacedComponent = {
      id,
      type,
      x,
      y,
      label: nextTechnicalLabel(type, circuit.components),
      momentary: type === "valve32" || type === "valve52" ? true : undefined,
      pressure: type === "source" ? 6 : undefined,
      actuation:
        type === "valve32" || type === "valve52" || type === "valve42"
          ? "botao"
          : type === "valve53"
            ? "pilotoDuplo"
            : undefined,
      returnType:
        type === "valve32" || type === "valve52" || type === "valve42"
          ? "mola"
          : type === "valve53"
            ? "centragemMolas"
            : undefined,
      preset: type === "counter" ? 1 : undefined,
      speed:
        type.startsWith("cylinder") || type === "rotaryMotor" || type === "rotaryOscillator"
          ? 1
          : undefined,
      springAction: type === "cylinderSingle" ? "retornoMola" : undefined,
      cushioning: type.startsWith("cylinder") ? "nenhum" : undefined,
      trigger: type === "sensor" ? "extended" : undefined,
      delay: type === "valveTimer" ? 2 : undefined,
      restriction: type === "throttle" || type === "throttleOneWay" ? 1 : undefined,
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
    setCircuit((previous) =>
      sanitizeCircuit({
        ...previous,
        components: previous.components.map((component) =>
          component.id === selectedId ? { ...component, ...patch } : component,
        ),
      }),
    );

  /** remove um componente e todas as mangueiras ligadas a ele */
  const deleteComponent = (id: string) => {
    if (running) {
      showMessage("Pause a simulação para remover componentes.");
      return;
    }
    const target = circuit.components.find((component) => component.id === id);
    const attached = countAttachedTubes(circuit, id);

    setCircuit((previous) => removeComponent(previous, id));

    if (selectedId === id) setSelectedId(null);
    if (pendingPort?.componentId === id) setPendingPort(null);

    showMessage(
      attached > 0
        ? `${target?.label ?? "Componente"} removido com ${attached} ${
            attached === 1 ? "mangueira" : "mangueiras"
          }.`
        : `${target?.label ?? "Componente"} removido.`,
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    deleteComponent(selectedId);
  };

  const handlePortClick = (componentId: string, portId: string) => {
    if (running) {
      showMessage("Pause a simulação para ligar mangueiras.");
      return;
    }
    if (!pendingPort) {
      setPendingPort({ componentId, portId });
      return;
    }
    if (pendingPort.componentId === componentId && pendingPort.portId === portId) {
      setPendingPort(null);
      return;
    }
    const from = pendingPort;
    const to = { componentId, portId };
    const validation = validateConnection(circuit, from, to);
    if (!validation.valid) {
      showMessage(validation.message);
      return;
    }
    setCircuit((previous) => ({
      ...previous,
      tubes: [...previous.tubes, { id: nextId("tube"), medium: validation.medium, from, to }],
    }));
    setPendingPort(null);
  };

  const deleteTube = (id: string) => {
    if (running) {
      showMessage("Pause a simulação para remover mangueiras.");
      return;
    }
    setCircuit((previous) => removeTube(previous, id));
    if (selectedTubeId === id) setSelectedTubeId(null);
    showMessage("Mangueira removida.");
  };

  /** reposiciona os cotovelos da mangueira arrastada na bancada */
  const moveTube = (id: string, midY: number, midX: number) =>
    setCircuit((previous) => ({
      ...previous,
      tubes: previous.tubes.map((tube) => (tube.id === id ? { ...tube, midY, midX } : tube)),
    }));

  const loadPreset = (preset: Circuit) => {
    setCircuit(preset);
    setSelectedId(null);
    setSelectedTubeId(null);
    setPendingPort(null);
    reset();
  };

  /** Carrega um circuito salvo ou importado, assumindo sua identidade. */
  const loadProject = (loaded: Circuit, name: string, id: string) => {
    setRunning(false);
    loadPreset(loaded);
    setProjectName(name);
    setProjectId(id);
  };

  /**
   * Grava o circuito atual. Na primeira vez pede o nome; depois sobrescreve o
   * mesmo projeto, e "Salvar como" fica por conta de renomear na biblioteca.
   */
  const handleSave = () => {
    const name = projectId
      ? projectName
      : (window.prompt("Nome do projeto:", projectName) ?? "").trim();
    if (!name) return;
    const saved = saveProject(name, sanitizeCircuit(circuit), projectId || undefined);
    setProjectId(saved.id);
    setProjectName(saved.name);
    showMessage(`Projeto "${saved.name}" salvo neste navegador.`);
  };

  const activeCylinders = circuit.components.filter((c) => c.type.startsWith("cylinder"));

  const printTechnicalDiagram = () => {
    setSelectedId(null);
    setSelectedTubeId(null);
    setPendingPort(null);
    window.setTimeout(() => window.print(), 80);
  };

  return (
    <div className="simulator-page flex h-screen flex-col overflow-hidden">
      <div className="editor-only">
        <SiteHeader />
      </div>

      <div className="editor-only flex items-center gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-2">
        <span className="shrink-0 font-mono text-[10px] font-semibold uppercase text-primary">
          Modo editor
        </span>
        <Button type="button" onClick={() => setRunning((v) => !v)} size="sm">
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pausar" : "Simular"}
        </Button>
        <Button type="button" onClick={reset} variant="outline" size="sm">
          <RotateCcw className="size-4" /> Reiniciar
        </Button>
        <Button
          type="button"
          onClick={() => loadPreset(basicCircuit())}
          variant="outline"
          size="sm"
        >
          Exemplo dupla ação
        </Button>
        <Button
          type="button"
          onClick={() => loadPreset(springReturnCircuit())}
          variant="outline"
          size="sm"
        >
          Exemplo simples ação
        </Button>
        <Button
          type="button"
          onClick={() => loadPreset({ components: [], tubes: [] })}
          variant="outline"
          size="sm"
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
            onClick={handleSave}
            title="Gravar o circuito neste navegador"
            variant="outline"
            size="sm"
          >
            <Save className="size-4" /> Salvar projeto
          </Button>
          <Button
            type="button"
            onClick={() => setProjectsOpen(true)}
            title="Abrir, renomear, exportar ou importar circuitos"
            variant="outline"
            size="sm"
          >
            <FolderOpen className="size-4" /> Meus projetos
          </Button>
        </div>
      </div>

      <div className="editor-only flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:block">
          <Palette onAdd={(type) => addComponent(type)} editable={!running} />
        </aside>

        <main className="relative min-w-0 flex-1">
          <Canvas
            circuit={circuit}
            runtime={runtime}
            solved={solved}
            selectedId={selectedId}
            selectedTubeId={selectedTubeId}
            pendingPort={pendingPort}
            onSelect={setSelectedId}
            onSelectTube={setSelectedTubeId}
            onDeleteComponent={deleteComponent}
            onDeleteTube={deleteTube}
            onMoveTube={moveTube}
            editable={!running}
            onMove={moveComponent}
            onPortClick={handlePortClick}
            onActivate={activateComponent}
            blockedId={blockedId}
            onDropComponent={(type, x, y) => addComponent(type as ComponentType, x, y)}
          />
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            {connectionMessage && (
              <div className="rounded-sm border border-destructive bg-surface px-3 py-1.5 text-xs">
                {connectionMessage}
              </div>
            )}
            {blockedId && !connectionMessage && (
              <div className="rounded-sm border border-destructive bg-surface px-3 py-1.5 text-xs">
                Sem pressão válida: verifique a alimentação, os escapes e as conexões.
              </div>
            )}
            {solved.conflicts.size > 0 && (
              <div className="rounded-sm border border-destructive bg-surface px-3 py-1.5 text-xs text-destructive">
                Conflito: uma linha alimentada está ligada diretamente ao escape.
              </div>
            )}
            {pendingPort && (
              <div className="rounded-sm border border-primary bg-surface px-3 py-1.5 text-xs">
                Selecione a porta de destino para concluir a mangueira
              </div>
            )}
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-sidebar xl:block">
          <PropertiesPanel
            circuit={circuit}
            selected={selected}
            runtime={runtime}
            onChange={patchSelected}
            onDelete={deleteSelected}
            onDeleteTube={deleteTube}
            editable={!running}
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
              {solved.conflicts.size > 0 && (
                <li className="flex justify-between text-destructive">
                  <span>Conflitos</span>
                  <span>{solved.conflicts.size}</span>
                </li>
              )}
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

      <ProjectsDialog
        open={projectsOpen}
        onOpenChange={setProjectsOpen}
        circuit={circuit}
        currentName={projectName}
        onLoad={loadProject}
        onMessage={showMessage}
      />
    </div>
  );
}