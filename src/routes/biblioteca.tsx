import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ComponentGlyph } from "@/components/simulator/ComponentGlyph";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATALOG_LIST, FAMILIES } from "@/lib/pneumatics/catalog";
import type { ComponentDef, ComponentType, PlacedComponent } from "@/lib/pneumatics/types";

/** Símbolos ainda em revisão não são apresentados como referência validada. */
const SYMBOLS_IN_REVIEW = new Set<ComponentType>([
  "quickExhaust",
  "valveOr",
  "checkValve",
  "valveTimer",
  "throttleOneWay",
]);

function LibrarySymbol({ item }: { item: ComponentDef }) {
  const [open, setOpen] = useState(false);
  const comp: PlacedComponent = {
    id: `library-${item.type}`,
    type: item.type,
    x: 0,
    y: 0,
    label: item.short,
    actuation: item.type.startsWith("valve") ? "botao" : undefined,
    returnType: item.type.startsWith("valve") ? "mola" : undefined,
    pressure: item.type === "source" ? 6 : undefined,
    restriction: item.type === "throttle" || item.type === "throttleOneWay" ? 1 : undefined,
  };
  const scale = Math.min(0.72, 104 / item.width, 76 / item.height);
  const symbol = (
    <ComponentGlyph
      comp={comp}
      stroke={0}
      actuated={false}
      signal={false}
      pressurizedPorts={new Set<string>()}
    />
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Ampliar símbolo de ${item.name}`}
        className="float-right ml-4 flex h-24 w-28 items-center justify-center overflow-hidden rounded-sm border border-border bg-background transition-colors hover:border-primary"
      >
        <span style={{ width: item.width * scale, height: item.height * scale }}>
          <span
            className="block"
            style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: item.width }}
          >
            {symbol}
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
            <DialogDescription>{item.description}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-56 items-center justify-center overflow-auto rounded-md border border-border bg-background p-6">
            {symbol}
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Família:</strong>{" "}
              {FAMILIES.find((family) => family.id === item.family)?.label}
            </p>
            <p>
              <strong>Dimensão na bancada:</strong> {item.width} × {item.height}
            </p>
            <p>
              <strong>Portas:</strong>{" "}
              {item.ports
                .map((port) => `${port.label} — ${PORT_KIND_LABEL[port.kind]}`)
                .join(" · ") || "sem portas pneumáticas"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const PORT_KIND_LABEL = {
  supply: "alimentação",
  work: "trabalho",
  exhaust: "exaustão",
  control: "pilotagem",
} as const;

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca pneumática | AutoMatikLab" },
      {
        name: "description",
        content:
          "Referência atualizada dos componentes disponíveis: preparação de ar, válvulas, cilindros, motores e elementos lógicos.",
      },
      { property: "og:title", content: "Biblioteca pneumática | AutoMatikLab" },
      {
        property: "og:description",
        content: "Portas, função e comportamento de cada componente da bancada virtual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-bold">Biblioteca de componentes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Cada componente da bancada tem portas nomeadas segundo a prática usual da pneumática. A
          lista abaixo é gerada a partir do mesmo catálogo usado pelo simulador, então nunca fica
          fora de sincronia com o que você encontra na bancada.
        </p>

        <p className="mt-5 max-w-3xl border-l-2 border-primary pl-4 font-mono text-xs leading-relaxed text-muted-foreground">
          Numeração normalizada: 1 (P) = alimentação/pressão · 2 (A) e 4 (B) = trabalho/saída · 3
          (R) e 5 (S) = exaustão · 14 e 12 = pilotagem pneumática. As portas piloto aparecem quando
          esse acionamento é escolhido nas propriedades da válvula.
        </p>

        {FAMILIES.map((family) => (
          <section key={family.id} className="mt-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
              {family.label}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {CATALOG_LIST.filter((item) => item.family === family.id).map((item) => (
                <article key={item.type} className="rounded-md border border-border bg-surface p-5">
                  {SYMBOLS_IN_REVIEW.has(item.type) ? (
                    <p className="mb-4 rounded-sm border border-dashed border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Símbolo em revisão visual
                    </p>
                  ) : (
                    <LibrarySymbol item={item} />
                  )}
                  <h3 className="text-base font-semibold">{item.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {item.ports.length
                      ? `Portas: ${item.ports
                          .map((port) => `${port.label} (${PORT_KIND_LABEL[port.kind]})`)
                          .join(" · ")}`
                      : "Componente de sinal, sem portas pneumáticas"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-12 rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
          Esta biblioteca é gerada diretamente do catálogo da bancada. Os componentes presentes, mas
          ainda em revisão visual, são acompanhados no{" "}
          <Link to="/roadmap" className="text-primary underline underline-offset-4">
            roadmap
          </Link>
          .
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}