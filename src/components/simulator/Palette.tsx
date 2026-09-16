import { CATALOG_LIST, FAMILIES } from "@/lib/pneumatics/catalog";
import type { ComponentType } from "@/lib/pneumatics/types";

interface PaletteProps {
  onAdd: (type: ComponentType) => void;
}

export function Palette({ onAdd }: PaletteProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Componentes
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Arraste para a bancada ou clique para inserir.
        </p>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {FAMILIES.map((family) => (
          <section key={family.id}>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-primary">
              {family.label}
            </h3>
            <ul className="space-y-2">
              {CATALOG_LIST.filter((item) => item.family === family.id).map((item) => (
                <li key={item.type}>
                  <button
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/component", item.type)}
                    onClick={() => onAdd(item.type)}
                    className="w-full cursor-grab rounded-sm border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-primary hover:bg-surface-strong"
                  >
                    <span className="block text-sm font-medium">{item.short}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
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
