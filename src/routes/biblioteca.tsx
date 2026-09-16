import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CATALOG_LIST, FAMILIES } from "@/lib/pneumatics/catalog";

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
          "Referência dos componentes disponíveis no simulador: fonte de ar, válvulas 3/2 e 5/2, cilindros, botões e sensores de fim de curso.",
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
          Novas famílias — como válvulas reguladoras de fluxo, temporizadores e blocos lógicos —
          ainda não existem na plataforma. Quando forem implementadas, aparecerão aqui
          automaticamente.{" "}
          <Link to="/roadmap" className="text-primary underline underline-offset-4">
            Ver roadmap
          </Link>
          .
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
