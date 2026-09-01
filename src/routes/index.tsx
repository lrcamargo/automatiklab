import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, CircuitBoard, Gauge, MousePointerClick, Wind, Workflow } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoMatikLab — simulador de circuitos pneumáticos" },
      {
        name: "description",
        content:
          "Plataforma educacional em português para montar, conectar e simular circuitos pneumáticos: válvulas, cilindros, botões e sensores em uma bancada virtual.",
      },
      { property: "og:title", content: "AutoMatikLab — simulador de circuitos pneumáticos" },
      {
        property: "og:description",
        content:
          "Monte circuitos pneumáticos em uma bancada virtual e veja pressão e movimento em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    icon: Boxes,
    title: "1. Escolha os componentes",
    text: "Fonte de ar, válvulas direcionais 3/2 e 5/2, cilindros de simples e dupla ação, botões e fins de curso.",
  },
  {
    icon: Workflow,
    title: "2. Ligue as mangueiras",
    text: "Clique em uma porta e depois na porta de destino. As linhas mostram o caminho do ar entre alimentação, trabalho e escape.",
  },
  {
    icon: MousePointerClick,
    title: "3. Acione e observe",
    text: "Botões momentâneos ou com trava comutam as válvulas; o cilindro avança e recua conforme a pressão em cada câmara.",
  },
];

const HIGHLIGHTS = [
  {
    icon: Wind,
    title: "Pneumática de verdade no centro",
    text: "O motor de simulação propaga pressão pelo grafo de portas, respeitando posições de válvula e escapes.",
  },
  {
    icon: CircuitBoard,
    title: "Arquitetura preparada para crescer",
    text: "Catálogo, circuito e motor são camadas separadas — novos componentes entram sem reescrever a bancada.",
  },
  {
    icon: Gauge,
    title: "Leitura clara do estado",
    text: "Linhas pressurizadas animadas, porcentagem de curso e monitor lateral com o estado de cada atuador.",
  },
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="grid-plate absolute inset-0 opacity-40" aria-hidden />
          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                Laboratório virtual · PT-BR
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                Aprenda pneumática montando o circuito, não decorando o diagrama.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                O AutoMatikLab é uma bancada de simulação para ensino técnico. Você posiciona
                os componentes em uma grade, conecta as mangueiras entre as portas e vê o ar
                percorrer o circuito enquanto o cilindro se move.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/simulador"
                  className="rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Abrir o simulador
                </Link>
                <Link
                  to="/biblioteca"
                  className="rounded-sm border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Ver biblioteca de componentes
                </Link>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface p-4 shadow-2xl">
              <div className="hazard-strip h-1.5 w-full rounded-full" />
              <div className="mt-4 space-y-3 font-mono text-xs">
                {[
                  ["fonte", "6 bar · ativa"],
                  ["válvula V1", "5/2 · repouso"],
                  ["cilindro A", "curso 0%"],
                  ["fim de curso A1", "sinal off"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between border-b border-border/60 pb-2"
                  >
                    <span className="text-muted-foreground uppercase tracking-widest">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Painel ilustrativo do monitor disponível na bancada.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold">Como funciona</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <article key={step.title} className="rounded-md border border-border bg-surface p-5">
                <step.icon className="size-5 text-primary" />
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto w-full max-w-7xl px-4 py-16">
            <h2 className="text-2xl font-bold">O que já está pronto</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <article key={item.title} className="rounded-md border border-border bg-background p-5">
                  <item.icon className="size-5 text-primary" />
                  <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
              Esta é a primeira versão da plataforma. Salvamento de projetos, contas de usuário e
              outras famílias de componentes ainda não estão disponíveis — o que está planejado
              aparece no{" "}
              <Link to="/roadmap" className="text-primary underline underline-offset-4">
                roadmap
              </Link>
              , sem promessas de prazo.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
