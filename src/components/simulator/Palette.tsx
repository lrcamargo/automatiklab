import { CATALOG_LIST, FAMILIES } from "@/lib/pneumatics/catalog";
import type { ComponentType } from "@/lib/pneumatics/types";

interface PaletteProps {
  onAdd: (type: ComponentType) => void;
  /** Com a simulação rodando não se insere componente. */
  editable: boolean;
}

/**
 * Paleta em grade: cada componente é um quadrado com a sigla técnica em
 * destaque e o nome curto abaixo. A lista vertical crescia demais conforme a
 * biblioteca aumentava; a grade mostra o dobro de itens na mesma altura e o
 * nome completo continua acessível pelo `title` (tooltip nativo).
 */
export function Palette({ onAdd, editable }: PaletteProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Componentes
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {editable
            ? "Arraste para a bancada ou clique para inserir."
            : "Simulação em execução: pause para montar o circuito."}
        </p>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {FAMILIES.map((family) => (
          <section key={family.id}>
            <h3 className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-primary">
              {family.label}
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {CATALOG_LIST.filter((item) => item.family === family.id).map((item) => (
                <li key={item.type}>
                  <button
                    type="button"
                    draggable={editable}
                    disabled={!editable}
                    title={item.name}
                    aria-label={item.name}
                    onDragStart={(event) => event.dataTransfer.setData("text/component", item.type)}
                    onClick={() => onAdd(item.type)}
                    className="flex aspect-square w-full cursor-grab flex-col items-center justify-center gap-1 rounded-sm border border-border bg-surface p-1.5 text-center transition-colors hover:border-primary hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-surface"
                  >
                    <span className="font-mono text-[13px] font-semibold leading-none text-foreground">
                      {item.short}
                    </span>
                    <span className="line-clamp-3 text-[10px] leading-tight text-muted-foreground">
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}