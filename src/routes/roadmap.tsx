import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap e expansão | Pneumatik Lab" },
      {
        name: "description",
        content:
          "O que já funciona no simulador pneumático, o que está em preparação na interface e as direções de evolução da plataforma.",
      },
      { property: "og:title", content: "Roadmap e expansão | Pneumatik Lab" },
      {
        property: "og:description",
        content: "Estado atual honesto da plataforma e direções de evolução, sem prazos.",
      },
    ],
  }),
  component: RoadmapPage,
});

const DONE = [
  "Bancada com grade, arrastar e soltar e seleção de componentes",
  "Catálogo com fonte de ar, válvulas 3/2 e 5/2, cilindros de simples e dupla ação, botão e fim de curso",
  "Conexão de mangueiras porta a porta, com destaque das linhas pressurizadas",
  "Motor de simulação com propagação de pressão, escapes e movimento contínuo do cilindro",
  "Painel de propriedades: identificação, acionamento, modo do botão e velocidade de curso",
  "Dois circuitos de exemplo prontos para estudo",
];

const PREPARED = [
  "Salvar projeto e Meus projetos: botões visíveis na barra da bancada, ainda desabilitados por não haver persistência",
  "Sensores hoje geram sinal a partir da posição do cilindro, mas ainda não há lógica combinacional entre sinais",
];

const NEXT = [
  "Persistência de circuitos e contas de usuário",
  "Reguladores de fluxo, temporizadores e válvulas de duplo piloto",
  "Diagrama trajeto-passo sincronizado com a simulação",
  "Exercícios guiados com verificação automática",
  "Base eletropneumática e integração com lógica de comando",
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
          Esta página descreve exatamente o que existe hoje e o que ainda não existe. Nada
          listado em &quot;direções de evolução&quot; está disponível na plataforma, e não há
          datas comprometidas.
        </p>

        <div className="mt-8 grid gap-4">
          <Section title="Disponível agora" items={DONE} tone="text-[var(--color-signal)]" />
          <Section title="Presente na interface, ainda sem função" items={PREPARED} tone="text-primary" />
          <Section title="Direções de evolução (não implementado)" items={NEXT} tone="text-muted-foreground" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
