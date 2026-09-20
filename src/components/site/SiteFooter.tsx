import { Instagram, Music2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-xs uppercase tracking-widest">
          AutoMatikLab — laboratório virtual de automação
        </p>
        <p className="text-xs md:max-w-md">
          Projeto educacional independente. Simulação simplificada, sem substituir normas técnicas
          ou bancadas reais.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <a
            href="https://instagram.com/instleticia"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Instagram className="size-4" aria-hidden />
            @instleticia
          </a>
          <a
            href="https://tiktok.com/@lercamargo"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Music2 className="size-4" aria-hidden />
            @lercamargo
          </a>
        </div>
      </div>
    </footer>
  );
}