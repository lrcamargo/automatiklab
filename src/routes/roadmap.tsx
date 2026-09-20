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
  "Bancada com grade, arrastar e soltar, deslocamento livre e exclusão por clique",
  "Biblioteca com fonte de ar, Lubrifil, escape, válvulas 3/2, 4/2, 5/2 e 5/3 de centro fechado, cilindros de simples e dupla ação e fim de curso",
  "Elementos lógicos OU e E, temporizadora, contador pneumático, retenção, escape rápido e reguladoras de fluxo uni e bidirecional",
  "Acionamento configurável por válvula: botão, alavanca, pedal, rolete, mola, pilotos e solenoides",
  "Pilotagem conectável pelas portas 14 e 12, inclusive com memória para duplo piloto",
  "Propagação topológica de pressão e escape, movimento do cilindro e detecção de ligação direta à atmosfera",
  "Trajeto das mangueiras editável, validação de conexões duplicadas e identificações técnicas únicas por família",
  "Vista de diagrama técnico com impressão, circuitos de exemplo e testes automatizados do núcleo",
];

const PREPARED = [
  "Salvar projeto e Meus projetos: botões visíveis na barra da bancada, ainda desabilitados por não haver persistência",
  "Símbolos de solenoide disponíveis, ainda sem portas elétricas ou energização",
];

const NEXT = [
  "Persistência local dos circuitos, com importação e exportação em JSON",
  "Junções em T visíveis nas linhas e revisão visual da simbologia contra a norma",
  "Operação em telas pequenas e dispositivos por toque",
  "Modelo físico de pressão, vazão, força, carga, área do êmbolo e perdas",
  "Exercícios guiados com verificação automática e modo de falhas",
  "Base eletropneumática e integração futura com lógica de CLP",
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
          <Section
            title="Presente na interface, ainda sem função"
            items={PREPARED}
            tone="text-primary"
          />
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