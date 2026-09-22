import { Link } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { APP_VERSION_LABEL } from "@/lib/version";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/simulador", label: "Simulador" },
  { to: "/biblioteca", label: "Biblioteca" },
  { to: "/roadmap", label: "Roadmap" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Gauge className="size-4" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">
            AUTOMATIK<span className="text-primary">LAB</span>
          </span>
          <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            {APP_VERSION_LABEL}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-sm px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/simulador"
          className="ml-auto rounded-sm bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Abrir bancada
        </Link>
      </div>
    </header>
  );
}