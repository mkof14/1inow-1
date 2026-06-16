import { useEffect, useState } from "react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "@/lib/queries";
import { fetchRecent } from "@/lib/wave1";
import { LayoutDashboard, FolderKanban, CheckSquare, Inbox, Briefcase, Clock } from "lucide-react";
import { useT } from "@/lib/i18n";

export function CommandBar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const navigate = useNavigate();
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const { data: recent = [] } = useQuery({ queryKey: ["recent"], queryFn: () => fetchRecent(8), enabled: open });

  const go = (to: string) => { onOpenChange(false); navigate({ to }); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("cmd.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("common.noResults")}</CommandEmpty>
        <CommandGroup heading={t("cmd.navigate")}>
          <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="size-4 mr-2" />{t("cmd.dashboard")}</CommandItem>
          <CommandItem onSelect={() => go("/my-work")}><Briefcase className="size-4 mr-2" />{t("cmd.myWork")}</CommandItem>
          <CommandItem onSelect={() => go("/inbox")}><Inbox className="size-4 mr-2" />{t("cmd.inbox")}</CommandItem>
          <CommandItem onSelect={() => go("/projects")}><FolderKanban className="size-4 mr-2" />{t("cmd.projects")}</CommandItem>
          <CommandItem onSelect={() => go("/tasks")}><CheckSquare className="size-4 mr-2" />{t("cmd.tasks")}</CommandItem>
        </CommandGroup>
        {recent.length > 0 && (
          <CommandGroup heading={t("cmd.recent")}>
            {recent.map((r) => (
              <CommandItem key={r.id} onSelect={() => go(r.entity_type === "project" ? `/projects/${r.label ?? r.entity_id}` : "/tasks")}>
                <Clock className="size-4 mr-2" />{r.label ?? r.entity_id}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {projects.length > 0 && (
          <CommandGroup heading={t("cmd.projects")}>
            {projects.slice(0, 10).map((p) => (
              <CommandItem key={p.id} onSelect={() => go(`/projects/${p.slug}`)}>
                <FolderKanban className="size-4 mr-2" />{p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}