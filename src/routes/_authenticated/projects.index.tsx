import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="group rounded-xl border border-border bg-card p-5 hover:border-accent/50 hover:shadow-md transition-all">
            <Link to="/projects/$slug" params={{ slug: p.slug }} className="block">
              <div className="flex items-start justify-between mb-4">
                <div className="relative size-12 rounded-lg grid place-items-center text-white font-semibold shadow-sm" style={{ background: p.color ?? "#0a2540" }}>
                  {p.name.slice(0, 2).toUpperCase()}
                  <span className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-card ${
                    p.priority === "critical" ? "bg-rose-500" : p.priority === "high" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL]}
                </span>
              </div>
              <h3 className="font-semibold tracking-tight">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">{p.description ?? t("page.projects.noDescription")}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{t("page.projects.priority").replace("{p}", p.priority)}</span>
                  <span className="font-mono text-foreground">{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent/70" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            </Link>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to="/projects/$slug" params={{ slug: p.slug }} className="text-xs text-accent font-medium hover:underline">
                {t("btn.open")} →
              </Link>
              <button
                onClick={() => { if (confirm(t("page.projects.archiveConfirm"))) archive.mutate(p.id); }}
                className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
              >
                <Trash2 className="size-3" /> {t("btn.archive")}
              </button>
            </div>
          </div>
        ))}
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