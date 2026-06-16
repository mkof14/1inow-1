import { useState } from "react";
import { Plus, FolderPlus, CheckSquare, MessageSquare, Calendar, FileText, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

type Action = { label: string; icon: any; onClick: () => void; tone?: string };

export function Fab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (to: string) => () => { setOpen(false); navigate({ to }); };

  const actions: Action[] = [
    { label: "New project",  icon: FolderPlus,    onClick: go("/projects") },
    { label: "New task",     icon: CheckSquare,   onClick: go("/tasks") },
    { label: "New message",  icon: MessageSquare, onClick: go("/communication") },
    { label: "New meeting",  icon: Calendar,      onClick: go("/calendar") },
    { label: "New document", icon: FileText,      onClick: go("/documents") },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1 fade-rise">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="group flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-card border border-border shadow-sm hover:shadow-md hover:border-accent/50 transition-all"
            >
              <span className="size-8 rounded-full bg-accent/10 text-accent grid place-items-center">
                <a.icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Create new"
        className={`size-14 rounded-full grid place-items-center text-primary-foreground shadow-lg hover:shadow-xl transition-all ${
          open ? "bg-foreground rotate-45" : "gradient-compass hover:scale-105"
        }`}
      >
        {open ? <X className="size-5" /> : <Plus className="size-6" />}
      </button>
    </div>
  );
}