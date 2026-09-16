export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-xs uppercase tracking-widest">
          AutoMatikLab — laboratório virtual de automação
        </p>
        <p className="text-xs">
          Projeto educacional independente. Simulação simplificada, sem substituir normas técnicas
          ou bancadas reais.
        </p>
      </div>
    </footer>
  );
}
