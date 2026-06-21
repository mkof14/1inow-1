import { useMemo, useState } from "react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "@/lib/queries";
import { fetchRecent } from "@/lib/wave1";
import { LayoutDashboard, FolderKanban, CheckSquare, Inbox, Briefcase, Clock, MessageSquare, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

export function CommandBar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const { data: recent = [] } = useQuery({ queryKey: ["recent"], queryFn: () => fetchRecent(8), enabled: open });

  const term = q.trim();
  const enabled = open && term.length >= 2;

  const tasks = useQuery({
    queryKey: ["cmd-tasks", term],
    enabled,
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("id,title,project_id,projects(slug,name)").ilike("title", `%${term}%`).limit(6);
      return data ?? [];
    },
  });
  const messages = useQuery({
    queryKey: ["cmd-messages", term],
    enabled,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("id,body,channel_id,channels(name)").ilike("body", `%${term}%`).is("deleted_at", null).limit(6);
      return data ?? [];
    },
  });
  const decisions = useQuery({
    queryKey: ["cmd-decisions", term],
    enabled,
    queryFn: async () => {
      const { data } = await (supabase as any).from("decisions").select("id,title,projects(slug)").ilike("title", `%${term}%`).limit(6);
      return data ?? [];
    },
  });

  const go = (to: string) => { onOpenChange(false); navigate({ to }); };

  const filteredProjects = useMemo(() => {
    if (!term) return projects.slice(0, 10);
    const tt = term.toLowerCase();
    return projects.filter((p: any) => p.name?.toLowerCase().includes(tt) || p.slug?.toLowerCase().includes(tt)).slice(0, 10);
  }, [projects, term]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("cmd.placeholder")} value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>{t("common.noResults")}</CommandEmpty>
        <CommandGroup heading={t("cmd.navigate")}>
          <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="size-4 mr-2" />{t("cmd.dashboard")}</CommandItem>
          <CommandItem onSelect={() => go("/my-work")}><Briefcase className="size-4 mr-2" />{t("cmd.myWork")}</CommandItem>
          <CommandItem onSelect={() => go("/inbox")}><Inbox className="size-4 mr-2" />{t("cmd.inbox")}</CommandItem>
          <CommandItem onSelect={() => go("/projects")}><FolderKanban className="size-4 mr-2" />{t("cmd.projects")}</CommandItem>
          <CommandItem onSelect={() => go("/tasks")}><CheckSquare className="size-4 mr-2" />{t("cmd.tasks")}</CommandItem>
        </CommandGroup>
        {!term && recent.length > 0 && (
          <CommandGroup heading={t("cmd.recent")}>
            {recent.map((r) => (
              <CommandItem key={r.id} onSelect={() => go(r.entity_type === "project" ? `/projects/${r.label ?? r.entity_id}` : "/tasks")}>
                <Clock className="size-4 mr-2" />{r.label ?? r.entity_id}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {filteredProjects.length > 0 && (
          <CommandGroup heading={t("cmd.projects")}>
            {filteredProjects.map((p: any) => (
              <CommandItem key={p.id} onSelect={() => go(`/projects/${p.slug}`)}>
                <FolderKanban className="size-4 mr-2" />{p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {(tasks.data?.length ?? 0) > 0 && (
          <CommandGroup heading={t("cmd.tasks")}>
            {tasks.data!.map((tk: any) => (
              <CommandItem key={tk.id} onSelect={() => go(tk.projects?.slug ? `/projects/${tk.projects.slug}` : "/tasks")}>
                <CheckSquare className="size-4 mr-2" />
                <span className="truncate">{tk.title}</span>
                {tk.projects?.name && <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">{tk.projects.name}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {(messages.data?.length ?? 0) > 0 && (
          <CommandGroup heading={t("cmd.messages")}>
            {messages.data!.map((m: any) => (
              <CommandItem key={m.id} onSelect={() => go("/communication")}>
                <MessageSquare className="size-4 mr-2 shrink-0" />
                <span className="truncate">{(m.body ?? "").slice(0, 80)}</span>
                {m.channels?.name && <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">#{m.channels.name}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {(decisions.data?.length ?? 0) > 0 && (
          <CommandGroup heading={t("cmd.decisions")}>
            {decisions.data!.map((d: any) => (
              <CommandItem key={d.id} onSelect={() => go("/approvals")}>
                <Gavel className="size-4 mr-2" />
                <span className="truncate">{d.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
