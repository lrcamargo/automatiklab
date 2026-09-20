import { CATALOG, hasPneumaticPilot } from "@/lib/pneumatics/catalog";
import { ACTUATIONS, ACTUATION_GROUPS } from "@/lib/pneumatics/types";
import type { Circuit, PlacedComponent, RuntimeState } from "@/lib/pneumatics/types";
import { Trash2 } from "lucide-react";

interface PropertiesPanelProps {
  circuit: Circuit;
  selected: PlacedComponent | null;
  runtime: RuntimeState;
  onChange: (patch: Partial<PlacedComponent>) => void;
  onDelete: () => void;
  onDeleteTube: (id: string) => void;
  /** Com a simulação rodando o painel fica somente leitura. */
  editable: boolean;
}

const fieldClass =
  "w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary";
const labelClass =
  "mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

export function PropertiesPanel({
  circuit,
  selected,
  runtime,
  onChange,
  onDelete,
  onDeleteTube,
  editable,
}: PropertiesPanelProps) {
  if (!selected) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest">Propriedades</h2>
        <p>Selecione um componente na bancada para editar rótulo, acionamento e parâmetros.</p>
        <div className="mt-4 rounded-sm border border-border bg-surface p-3 text-xs leading-relaxed">
          <strong className="text-foreground">Como conectar:</strong> clique em uma porta e depois
          na porta de destino para criar a mangueira. Clique duas vezes na mesma porta para
          cancelar.
        </div>
        <div className="mt-2 rounded-sm border border-border bg-surface p-3 text-xs leading-relaxed">
          <strong className="text-foreground">Como remover:</strong> clique em um componente ou em
          uma mangueira para selecioná-lo e use o botão × que aparece, ou a tecla Delete. Remover um
          componente também remove as mangueiras ligadas a ele.
        </div>
      </div>
    );
  }

  const def = CATALOG[selected.type];
  const cylinders = circuit.components.filter(
    (c) => c.type === "cylinderSingle" || c.type === "cylinderDouble",
  );
  const connectedTubes = circuit.tubes.filter(
    (tube) => tube.from.componentId === selected.id || tube.to.componentId === selected.id,
  );
  const hasElectricalActuation = [selected.actuation, selected.returnType].some((type) =>
    type?.toLowerCase().includes("solenoide"),
  );

  return (
    <fieldset
      disabled={!editable}
      className="space-y-4 border-0 p-4 disabled:opacity-60 [&:disabled_button]:cursor-not-allowed"
    >
      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Propriedades
        </h2>
        <p className="mt-1 text-sm font-semibold">{def.name}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{def.description}</p>
      </div>

      {!editable && (
        <p className="rounded-sm border border-border bg-surface px-2 py-1.5 text-xs text-muted-foreground">
          Simulação em execução: pause para editar ou remover.
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="label">
          Identificação
        </label>
        <input
          id="label"
          className={fieldClass}
          value={selected.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </div>

      {selected.type === "source" && (
        <div>
          <label className={labelClass} htmlFor="pressure">
            Pressão de alimentação ({(selected.pressure ?? 6).toFixed(1)} bar)
          </label>
          <input
            id="pressure"
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={selected.pressure ?? 6}
            onChange={(event) => onChange({ pressure: Number(event.target.value) })}
            className="w-full accent-[var(--color-primary)]"
          />
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Com 0 bar a fonte fica fechada. Nesta etapa, valores acima de zero alimentam o modelo
            topológico; os efeitos quantitativos da pressão virão com o modelo físico.
          </p>
        </div>
      )}

      {(selected.type === "valve32" || selected.type === "valve52") && (
        <>
          <div>
            <label className={labelClass} htmlFor="actuation">
              Acionamento (lado esquerdo)
            </label>
            <select
              id="actuation"
              className={fieldClass}
              value={selected.actuation ?? "botao"}
              onChange={(event) =>
                onChange({ actuation: event.target.value as PlacedComponent["actuation"] })
              }
            >
              {ACTUATION_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {ACTUATIONS.filter((item) => item.group === group).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="returnType">
              Retorno (lado direito)
            </label>
            <select
              id="returnType"
              className={fieldClass}
              value={selected.returnType ?? "mola"}
              onChange={(event) =>
                onChange({ returnType: event.target.value as PlacedComponent["returnType"] })
              }
            >
              {ACTUATION_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {ACTUATIONS.filter((item) => item.group === group).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </>
      )}

      {(selected.type === "valve32" || selected.type === "valve52") &&
        (hasPneumaticPilot(selected.actuation) || hasPneumaticPilot(selected.returnType)) && (
          <div className="rounded-sm border border-primary/40 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            O acionamento pneumático cria as portas de pilotagem 14 e/ou 12. Conecte a saída 2 da
            válvula de sinal diretamente à porta piloto correspondente.
          </div>
        )}

      {hasElectricalActuation && (
        <div className="rounded-sm border border-dashed border-border p-3 text-xs leading-relaxed text-muted-foreground">
          O símbolo elétrico já está disponível para preparar diagramas, mas sua bobina só será
          energizada quando o domínio eletropneumático for implementado.
        </div>
      )}

      {(selected.type === "valve32" || selected.type === "valve52") &&
        selected.actuation === "botao" && (
          <div>
            <label className={labelClass} htmlFor="mode">
              Modo
            </label>
            <select
              id="mode"
              className={fieldClass}
              value={selected.momentary ? "pulso" : "trava"}
              onChange={(event) => onChange({ momentary: event.target.value === "pulso" })}
            >
              <option value="pulso">Momentâneo (pulso)</option>
              <option value="trava">Com trava (liga/desliga)</option>
            </select>
          </div>
        )}

      {selected.type === "sensor" && (
        <>
          <div>
            <label className={labelClass} htmlFor="target">
              Cilindro observado
            </label>
            <select
              id="target"
              className={fieldClass}
              value={selected.targetId ?? ""}
              onChange={(event) => onChange({ targetId: event.target.value || null })}
            >
              <option value="">— nenhum —</option>
              {cylinders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="trigger">
              Dispara quando
            </label>
            <select
              id="trigger"
              className={fieldClass}
              value={selected.trigger ?? "extended"}
              onChange={(event) =>
                onChange({ trigger: event.target.value as "extended" | "retracted" })
              }
            >
              <option value="extended">Cilindro avançado</option>
              <option value="retracted">Cilindro recuado</option>
            </select>
          </div>
        </>
      )}

      {/*
        Variantes do cilindro (Quadro 6 da apostila). Em vez de um tipo de
        componente para cada desenho, a paleta traz só simples e dupla ação e
        as variações são configuradas aqui.
      */}
      {selected.type === "cylinderSingle" && (
        <div>
          <label className={labelClass} htmlFor="springAction">
            Ação da mola
          </label>
          <select
            id="springAction"
            className={fieldClass}
            value={selected.springAction ?? "retornoMola"}
            onChange={(event) =>
              onChange({ springAction: event.target.value as "retornoMola" | "avancoMola" })
            }
          >
            <option value="retornoMola">
              Retorno por mola — entrada traseira (repouso recuado)
            </option>
            <option value="avancoMola">
              Avanço por mola — entrada dianteira (repouso avançado)
            </option>
          </select>
        </div>
      )}

      {selected.type === "cylinderDouble" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.throughRod === true}
            onChange={(event) => onChange({ throughRod: event.target.checked })}
            className="size-4 accent-[var(--color-primary)]"
          />
          Haste passante (sai pelos dois lados)
        </label>
      )}

      {(selected.type === "cylinderSingle" || selected.type === "cylinderDouble") && (
        <div>
          <label className={labelClass} htmlFor="cushioning">
            Amortecimento de fim de curso
          </label>
          <select
            id="cushioning"
            className={fieldClass}
            value={selected.cushioning ?? "nenhum"}
            onChange={(event) =>
              onChange({ cushioning: event.target.value as "nenhum" | "fixo" | "regulavel" })
            }
          >
            <option value="nenhum">Sem amortecimento</option>
            <option value="fixo">Amortecimento fixo (sem regulagem)</option>
            <option value="regulavel">Amortecimento regulável</option>
          </select>
        </div>
      )}

      {(selected.type === "cylinderSingle" ||
        selected.type === "cylinderDouble" ||
        selected.type === "rotaryMotor" ||
        selected.type === "rotaryOscillator") && (
        <div>
          <label className={labelClass} htmlFor="speed">
            Velocidade de curso ({(selected.speed ?? 1).toFixed(1)}×)
          </label>
          <input
            id="speed"
            type="range"
            min={0.2}
            max={2}
            step={0.1}
            value={selected.speed ?? 1}
            onChange={(event) => onChange({ speed: Number(event.target.value) })}
            className="w-full accent-[var(--color-primary)]"
          />
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Curso atual: {Math.round((runtime.strokes[selected.id] ?? 0) * 100)}%
          </p>
        </div>
      )}

      {selected.type === "valveTimer" && (
        <div>
          <label className={labelClass} htmlFor="delay">
            Retardo ({(selected.delay ?? 2).toFixed(1)} s)
          </label>
          <input
            id="delay"
            type="range"
            min={0.2}
            max={10}
            step={0.1}
            value={selected.delay ?? 2}
            onChange={(event) => onChange({ delay: Number(event.target.value) })}
            className="w-full accent-[var(--color-primary)]"
          />
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Contagem: {(runtime.timerElapsed?.[selected.id] ?? 0).toFixed(1)} s
          </p>
        </div>
      )}

      {selected.type === "counter" && (
        <div>
          <label className={labelClass} htmlFor="preset">
            Pré-seleção (1 a 99999)
          </label>
          <input
            id="preset"
            type="number"
            min={1}
            max={99999}
            step={1}
            value={selected.preset ?? 1}
            onChange={(event) =>
              onChange({
                preset: Math.min(99999, Math.max(1, Math.round(Number(event.target.value) || 1))),
              })
            }
            className="w-full rounded-sm border border-border bg-surface px-2 py-1 font-mono text-sm"
          />
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Contagem: {runtime.counts?.[selected.id] ?? 0} — a saída 2 abre ao atingir a
            pré-seleção. O sinal em 10 zera o contador.
          </p>
        </div>
      )}

      {(selected.type === "throttle" || selected.type === "throttleOneWay") && (
        <div>
          <label className={labelClass} htmlFor="restriction">
            Abertura ({Math.round((selected.restriction ?? 1) * 100)}%)
          </label>
          <input
            id="restriction"
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={selected.restriction ?? 1}
            onChange={(event) => onChange({ restriction: Number(event.target.value) })}
            className="w-full accent-[var(--color-primary)]"
          />
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            A abertura reduz a velocidade dos cilindros ligados a jusante.
          </p>
        </div>
      )}

      <div>
        <h3 className={labelClass}>Conexões pneumáticas</h3>
        {connectedTubes.length === 0 ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Este componente ainda não possui mangueiras.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {connectedTubes.map((tube) => {
              const selectedIsFrom = tube.from.componentId === selected.id;
              const localPort = selectedIsFrom ? tube.from.portId : tube.to.portId;
              const remote = selectedIsFrom ? tube.to : tube.from;
              const remoteComponent = circuit.components.find(
                (component) => component.id === remote.componentId,
              );
              return (
                <li
                  key={tube.id}
                  className="flex items-center justify-between gap-2 rounded-sm border border-border px-2 py-1.5 font-mono text-[11px]"
                >
                  <span className="min-w-0 truncate text-muted-foreground">
                    {localPort} → {remoteComponent?.label ?? "?"}:{remote.portId}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteTube(tube.id)}
                    className="shrink-0 text-destructive hover:underline"
                    aria-label={`Remover conexão da porta ${localPort}`}
                  >
                    remover
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-destructive/60 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-4" /> Remover componente
      </button>
    </fieldset>
  );
}