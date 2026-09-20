import { useEffect, useRef, useState } from "react";
import { Download, FolderOpen, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteProject,
  exportProject,
  getProject,
  importProject,
  listProjects,
  renameProject,
  type ProjectSummary,
} from "@/lib/pneumatics/storage";
import type { Circuit } from "@/lib/pneumatics/types";

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** circuito atual, usado na exportação do arquivo aberto */
  circuit: Circuit;
  currentName: string;
  /** carrega um circuito salvo na bancada */
  onLoad: (circuit: Circuit, name: string, id: string) => void;
  onMessage: (text: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Biblioteca de projetos gravados no navegador: abrir, renomear, excluir,
 * exportar e importar. Tudo vive em `localStorage`, então a lista é relida a
 * cada abertura em vez de manter estado espelhado.
 */
export function ProjectsDialog({
  open,
  onOpenChange,
  circuit,
  currentName,
  onLoad,
  onMessage,
}: ProjectsDialogProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setProjects(listProjects());

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const handleLoad = (id: string) => {
    const project = getProject(id);
    if (!project) {
      onMessage("Projeto não encontrado.");
      refresh();
      return;
    }
    onLoad(project.circuit, project.name, project.id);
    onOpenChange(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteProject(id);
    refresh();
    onMessage(`Projeto "${name}" excluído.`);
  };

  const commitRename = (id: string) => {
    if (draftName.trim()) renameProject(id, draftName);
    setRenamingId(null);
    refresh();
  };

  /** Exporta o circuito que está na bancada como arquivo .json. */
  const handleExport = () => {
    const blob = new Blob([exportProject(currentName, circuit)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${currentName.replace(/[^\w-]+/g, "-").toLowerCase() || "circuito"}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const result = importProject(await file.text());
    if (!result.ok) {
      onMessage(result.error);
      return;
    }
    onLoad(result.circuit, result.name, "");
    onOpenChange(false);
    onMessage(`Circuito "${result.name}" importado.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Meus projetos</DialogTitle>
          <DialogDescription>
            Os circuitos ficam gravados neste navegador. Limpar os dados do site apaga a lista, por
            isso exporte em .json o que quiser guardar.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          {projects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum projeto salvo ainda. Monte um circuito e use “Salvar projeto”.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((project) => (
                <li key={project.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    {renamingId === project.id ? (
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onBlur={() => commitRename(project.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitRename(project.id);
                          if (event.key === "Escape") setRenamingId(null);
                        }}
                        className="w-full rounded-sm border border-border bg-surface px-2 py-1 text-sm"
                      />
                    ) : (
                      <p className="truncate text-sm font-medium">{project.name}</p>
                    )}
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {project.componentCount} componentes · {project.tubeCount} mangueiras ·{" "}
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={() => handleLoad(project.id)}>
                    Abrir
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Renomear"
                    onClick={() => {
                      setRenamingId(project.id);
                      setDraftName(project.name);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Excluir"
                    onClick={() => handleDelete(project.id, project.name)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" /> Exportar atual
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" /> Importar .json
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImportFile(file);
                event.target.value = "";
              }}
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            <FolderOpen className="size-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}