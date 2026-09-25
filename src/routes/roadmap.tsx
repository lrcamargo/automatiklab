import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap e expansão | AutoMatikLab" },
      {
        name: "description",
        content:
          "O que já funciona no simulador pneumático, o que está em preparação na interface e as direções de evolução da plataforma.",
      },
      { property: "og:title", content: "Roadmap e expansão | AutoMatikLab" },
      {
        property: "og:description",
        content: "Estado atual honesto da plataforma e direções de evolução, sem prazos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoadmapPage,
});

const DONE = [
  "Bancada livre com zoom, arrastar, conectar, editar mangueiras e excluir componentes",
  "Válvulas direcionais 3/2, 4/2, 5/2 e 5/3 com pilotagem 12/14 e memória",
  "Cilindros de simples e dupla ação, cilindro rotativo e motores pneumáticos simples e reversível",
  "Fonte de ar e unidades de conservação completa e simplificada conferidas",
  "Acionamentos por botão, alavanca, pedal, mola, piloto, servo-piloto e solenoides",
  "Escapes conectáveis, circuitos de exemplo, impressão técnica e projetos salvos no navegador",
  "Versionamento SemVer beta e entrega incremental de arquivos completos",
];

const PREPARED = [
  "Revisão visual em andamento: escape rápido e elemento OU",
  "Implementados e em conferência: elemento E, temporizadora, retenção e reguladoras de fluxo",
  "Solenoides disponíveis graficamente, ainda sem domínio elétrico ou energização",
];

const NEXT = [
  "Variantes do acionamento por rolete (fixo, articulado/escamoteável e respectivos sentidos)",
  "Concluir a revisão visual dos símbolos restantes contra a apostila",
  "Junções em T visíveis nas linhas",
  "Operação em telas pequenas e dispositivos por toque",
  "Modelo físico de pressão, vazão, força, carga, área do êmbolo e perdas",
  "Exercícios guiados, modo de falhas e futura base eletropneumática/CLP",
];

function Section({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <section className="rounded-md border border-border bg-surface p-6">
      <h2 className={`font-mono text-xs uppercase tracking-widest ${tone}`}>{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RoadmapPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-bold">Roadmap e expansão</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Esta página descreve exatamente o que existe hoje e o que ainda não existe. Nada listado
          em &quot;direções de evolução&quot; está disponível na plataforma, e não há datas
          comprometidas.
        </p>

        <div className="mt-8 grid gap-4">
          <Section title="Disponível agora" items={DONE} tone="text-[var(--color-signal)]" />
          <Section title="Em desenvolvimento ou revisão" items={PREPARED} tone="text-primary" />
          <Section
            title="Direções de evolução (não implementado)"
            items={NEXT}
            tone="text-muted-foreground"
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}