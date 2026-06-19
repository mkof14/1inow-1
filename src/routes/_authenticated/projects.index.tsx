import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchProjects, PROJECT_STATUSES, PROJECT_STATUS_LABEL } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, LayoutGrid, Table as TableIcon, Activity, Search } from "lucide-react";
import { toast } from "sonner";
import { PortfolioCard } from "@/components/icons/compass-icons";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const t = useT();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const qc = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "planning", priority: "medium", color: "#06b6d4" });
  const [view, setView] = useState<"grid" | "table" | "risk">("grid");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("projects:selectedId");
      if (saved) setSelectedId(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem("projects:selectedId", selectedId);
      else localStorage.removeItem("projects:selectedId");
    } catch {}
  }, [selectedId]);

  const create = useMutation({
    mutationFn: async () => {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      const { data, error } = await supabase.from("projects").insert({
        name: form.name, slug, description: form.description,
        status: form.status as any, priority: form.priority as any,
        color: form.color, created_by: user!.id, owner_id: user!.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setForm({ name: "", description: "", status: "planning", priority: "medium", color: "#06b6d4" });
      navigate({ to: "/projects/$slug", params: { slug: p.slug } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Archived"); qc.invalidateQueries({ queryKey: ["projects"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return (projects.data ?? []).filter((p: any) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [projects.data, q, statusFilter]);

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-accent"><PortfolioCard size={44} /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-display">{t("page.projects.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("page.projects.subtitle")}</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> {t("page.projects.new")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("page.projects.create")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["critical","high","medium","low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20 p-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>{t("common.create")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("page.projects.searchPh")} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder={t("tbl.status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("page.projects.allStatuses")}</SelectItem>
            {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto inline-flex rounded-lg border border-border p-0.5 bg-card">
          {[
            { id: "grid", icon: LayoutGrid, label: "Grid" },
            { id: "table", icon: TableIcon, label: "Table" },
            { id: "risk", icon: Activity, label: "Risk" },
          ].map((v) => (
            <button key={v.id} onClick={() => setView(v.id as any)}
              className={`px-2.5 h-7 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition ${
                view === v.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}><v.icon className="size-3.5" />{v.label}</button>
          ))}
        </div>
      </div>

      {view === "grid" && (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p, idx) => {
          const isSelected = selectedId === p.id;
          return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => setSelectedId(isSelected ? null : p.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedId(isSelected ? null : p.id);
              }
            }}
            className={`group relative rounded-2xl border bg-card p-5 surface-aurora shimmer-border ring-accent-soft transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_35%,transparent)] active:scale-[0.99] active:duration-150 fade-rise cursor-pointer ${
              isSelected
                ? "border-accent ring-[3px] ring-accent/30 shadow-[0_18px_50px_-18px_color-mix(in_oklab,var(--accent)_55%,transparent)] -translate-y-0.5"
                : "border-border"
            }`}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {/* Left color accent strip */}
            <div
              className={`absolute left-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isSelected ? "top-2 bottom-2 w-[5px] opacity-100 shadow-[0_0_16px_color-mix(in_oklab,var(--accent)_70%,transparent)]" : "top-4 bottom-4 w-[3px] opacity-60 group-hover:opacity-100 group-hover:top-3 group-hover:bottom-3"
              }`}
              style={{ background: p.color ?? "#0a2540" }}
            />
            <div className="block relative z-10">
              <div className={`flex items-start justify-between mb-4 pl-2 -mx-2 px-2 py-1 rounded-xl transition-all duration-500 ease-out ${isSelected ? "bg-accent/[0.07] shadow-[inset_0_0_20px_color-mix(in_oklab,var(--accent)_8%,transparent)]" : "bg-transparent"}`}>
                <div className="relative size-12 rounded-xl grid place-items-center text-white font-semibold shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: p.color ?? "#0a2540" }}>
                  {p.name.slice(0, 2).toUpperCase()}
                  <span className={`absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-card transition-transform duration-300 group-hover:scale-125 ${
                    p.priority === "critical" ? "bg-rose-500 signal-pulse" : p.priority === "high" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all duration-500 ${
                  p.status === "active" || p.status === "in_progress" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                  p.status === "planning" || p.status === "idea" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20" :
                  p.status === "paused" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                  p.status === "completed" || p.status === "review" ? "bg-primary/10 text-primary border border-primary/20" :
                  "bg-muted text-muted-foreground border border-border"
                }`}>
                  {PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL]}
                </span>
              </div>
              <h2 className={`font-semibold tracking-tight pl-2 text-base transition-colors duration-300 ${isSelected ? "text-accent drop-shadow-[0_0_8px_color-mix(in_oklab,var(--accent)_35%,transparent)]" : "group-hover:text-accent"}`}>{p.name}</h2>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 min-h-[2rem] pl-2">{p.description ?? t("page.projects.noDescription")}</p>
              <div className={`mt-5 pl-2 -mx-2 px-2 py-2 rounded-xl transition-all duration-500 ease-out ${isSelected ? "bg-accent/[0.07] ring-1 ring-accent/25 shadow-[inset_0_0_24px_color-mix(in_oklab,var(--accent)_10%,transparent)]" : "bg-transparent ring-0"}`}>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${
                      p.priority === "critical" ? "bg-rose-500" : p.priority === "high" ? "bg-amber-500" : p.priority === "medium" ? "bg-sky-500" : "bg-emerald-500"
                    }`} />
                    {t("page.projects.priority").replace("{p}", p.priority)}
                  </span>
                  <span className={`font-mono font-medium transition-colors duration-300 ${isSelected ? "text-accent" : "text-foreground"}`}>{p.progress}%</span>
                </div>
                <div className={`rounded-full bg-muted/60 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSelected ? "h-2.5 ring-1 ring-accent/20 shadow-[0_0_12px_color-mix(in_oklab,var(--accent)_25%,transparent)]" : "h-2"}`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isSelected ? "from-accent via-primary/80 to-accent shadow-[0_0_14px_color-mix(in_oklab,var(--accent)_50%,transparent)]" : "from-accent to-primary/70 group-hover:from-accent group-hover:to-accent/80"
                    }`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              className={`mt-4 pt-4 border-t border-border/60 flex items-center justify-between transition-all duration-500 ease-out pl-2 ${
                isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
              }`}
            >
              <Link
                to="/projects/$slug"
                params={{ slug: p.slug }}
                className={`text-xs font-semibold inline-flex items-center gap-1 transition-all duration-300 px-2.5 py-1 rounded-md ${
                  isSelected
                    ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_14px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
                    : "text-accent hover:text-accent-foreground"
                }`}
              >
                {t("btn.open")} <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
              <button
                onClick={() => { if (confirm(t("page.projects.archiveConfirm"))) archive.mutate(p.id); }}
                className={`text-xs inline-flex items-center gap-1 transition-colors duration-300 ${
                  isSelected ? "text-foreground hover:text-destructive" : "text-muted-foreground hover:text-destructive"
                }`}
              >
                <Trash2 className="size-3" /> {t("btn.archive")}
              </button>
            </div>
          </div>
          );
        })}
      </div>
      )}

      {view === "table" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left">
                {[t("tbl.entity"), t("tbl.status"), t("tbl.priority"), t("tbl.progress"), t("tbl.created")].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to="/projects/$slug" params={{ slug: p.slug }} className="inline-flex items-center gap-2.5 hover:text-accent">
                      <span className="size-5 rounded-sm" style={{ background: p.color ?? "#0a2540" }} />
                      <span className="font-medium">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.priority}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "risk" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-4 gap-3">
            {(["critical","high","medium","low"] as const).map(level => (
              <div key={level} className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{level}</div>
                {filtered.filter((p: any) => p.priority === level).map((p: any) => (
                  <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }}
                    className={`block p-3 rounded-lg border text-xs hover:border-accent/50 transition ${
                      level === "critical" ? "border-rose-500/30 bg-rose-500/5" :
                      level === "high" ? "border-amber-500/30 bg-amber-500/5" :
                      "border-border bg-muted/20"
                    }`}>
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-muted-foreground mt-0.5">{p.progress}% · {PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL]}</div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}