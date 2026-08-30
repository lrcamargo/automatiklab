import { CATALOG } from "@/lib/pneumatics/catalog";
import type { Circuit, PlacedComponent, RuntimeState } from "@/lib/pneumatics/types";
import { Trash2 } from "lucide-react";

interface PropertiesPanelProps {
  circuit: Circuit;
  selected: PlacedComponent | null;
  runtime: RuntimeState;
  onChange: (patch: Partial<PlacedComponent>) => void;
  onDelete: () => void;
}

const fieldClass =
  "w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary";
const labelClass = "mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

export function PropertiesPanel({
  circuit,
  selected,
  runtime,
  onChange,
  onDelete,
}: PropertiesPanelProps) {
  if (!selected) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest">Propriedades</h2>
        <p>
          Selecione um componente na bancada para editar rótulo, acionamento e parâmetros.
        </p>
        <div className="mt-4 rounded-sm border border-border bg-surface p-3 text-xs leading-relaxed">
          <strong className="text-foreground">Como conectar:</strong> clique em uma porta e
          depois na porta de destino para criar a mangueira. Clique duas vezes na mesma porta
          para cancelar.
        </div>
      </div>
    );
  }

  const def = CATALOG[selected.type];
  const actuators = circuit.components.filter(
    (c) => c.type === "button" || c.type === "sensor",
  );
  const cylinders = circuit.components.filter(
    (c) => c.type === "cylinderSingle" || c.type === "cylinderDouble",
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Propriedades
        </h2>
        <p className="mt-1 text-sm font-semibold">{def.name}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{def.description}</p>
      </div>

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

      {(selected.type === "valve32" || selected.type === "valve52") && (
        <div>
          <label className={labelClass} htmlFor="actuator">
            Acionado por
          </label>
          <select
            id="actuator"
            className={fieldClass}
            value={selected.actuatorId ?? ""}
            onChange={(event) => onChange({ actuatorId: event.target.value || null })}
          >
            <option value="">— sem acionamento —</option>
            {actuators.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {selected.type === "button" && (
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

      {(selected.type === "cylinderSingle" || selected.type === "cylinderDouble") && (
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

      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-destructive/60 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-4" /> Remover componente
      </button>
    </div>
  );
}
