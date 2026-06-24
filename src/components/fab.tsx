import { useState } from "react";
import { Plus, FolderPlus, CheckSquare, MessageSquare, Calendar, FileText, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Action = { label: string; icon: any; onClick: () => void; tone?: string };

export function Fab({ aiOpen, aiMode }: { aiOpen?: boolean; aiMode?: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (to: string) => () => {
    setOpen(false);
    navigate({ to });
  };

  const actions: Action[] = [
    { label: "New project", icon: FolderPlus, onClick: go("/projects") },
    { label: "New task", icon: CheckSquare, onClick: go("/tasks") },
    { label: "New message", icon: MessageSquare, onClick: go("/communication") },
    { label: "New meeting", icon: Calendar, onClick: go("/calendar") },
    { label: "New document", icon: FileText, onClick: go("/documents") },
  ];

  const isDockedOpen = aiOpen && aiMode === "docked";
  const isFloatingOpen = aiOpen && aiMode === "floating";

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 z-20 flex flex-col items-end gap-2 transition-[right,bottom] duration-300",
        isDockedOpen && "right-5 lg:right-[410px]",
        isFloatingOpen && "right-5 lg:right-[456px]",
        !isDockedOpen && !isFloatingOpen && "right-5",
      )}
    >
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1 fade-rise">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="group flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full bg-card border border-border shadow-sm hover:shadow-md hover:border-accent/50 transition-all"
            >
              <span className="size-7 rounded-full bg-accent/10 text-accent grid place-items-center">
                <a.icon className="size-3.5" />
              </span>
              <span className="text-xs font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Create new"
        className={`size-10 rounded-full grid place-items-center text-primary-foreground shadow-md hover:shadow-lg transition-all ${
          open ? "bg-foreground rotate-45" : "gradient-compass hover:scale-105"
        }`}
      >
        {open ? <X className="size-4" /> : <Plus className="size-4" />}
      </button>
    </div>
  );
}
