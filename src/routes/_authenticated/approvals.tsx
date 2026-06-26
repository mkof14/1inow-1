import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchDecisions,
  fetchProjects,
  DECISION_STATUS_LABEL,
  type DecisionStatus,
  type DecisionImpact,
} from "@/lib/queries";
import { createDecisionRecord, updateDecisionStatus } from "@/lib/decision-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { DecisionDiamond } from "@/components/icons/compass-icons";
import { Check, X, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/approvals")({ component: DecisionsPage });

const STATUS_STYLES: Record<DecisionStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  deferred: "bg-muted text-muted-foreground border-border",
  review: "bg-accent/10 text-accent border-accent/30",
};

const IMPACT_DOT: Record<DecisionImpact, string> = {
  low: "bg-muted-foreground/40",
  medium: "bg-accent",
  high: "bg-amber-500",
  critical: "bg-rose-500",
};

function DecisionsPage() {
  const t = useT();
  const qc = useQueryClient();
  const decisions = useQuery({ queryKey: ["decisions"], queryFn: fetchDecisions });
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<DecisionStatus | "all">("all");
  const [form, setForm] = useState({
    title: "",
    context: "",
    recommendation: "",
    impact: "medium" as DecisionImpact,
    project_id: "none",
  });

  const create = useMutation({
    mutationFn: async () => {
      await createDecisionRecord({
        title: form.title,
        context: form.context,
        recommendation: form.recommendation,
        impact: form.impact,
        projectId: form.project_id === "none" ? null : form.project_id,
      });
    },
    onSuccess: () => {
      toast.success("Decision opened");
      setOpen(false);
      setForm({ title: "", context: "", recommendation: "", impact: "medium", project_id: "none" });
      qc.invalidateQueries({ queryKey: ["decisions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DecisionStatus }) => {
      await updateDecisionStatus(id, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      toast.success("Decision recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = (decisions.data ?? []).filter((d: any) => filter === "all" || d.status === filter);
  const counts = (decisions.data ?? []).reduce((acc: Record<string, number>, d: any) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="text-accent">
            <DecisionDiamond size={44} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-display">
              {t("page.decisions.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("page.decisions.subtitle")}</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> {t("page.decisions.open")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("page.decisions.openA")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t("page.decisions.titlePh")}
                />
              </div>
              <div>
                <Label>Context</Label>
                <Textarea
                  rows={3}
                  value={form.context}
                  onChange={(e) => setForm({ ...form, context: e.target.value })}
                />
              </div>
              <div>
                <Label>Recommendation</Label>
                <Textarea
                  rows={2}
                  value={form.recommendation}
                  onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Impact</Label>
                  <Select
                    value={form.impact}
                    onValueChange={(v) => setForm({ ...form, impact: v as DecisionImpact })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["low", "medium", "high", "critical"] as const).map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project</Label>
                  <Select
                    value={form.project_id}
                    onValueChange={(v) => setForm({ ...form, project_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("page.decisions.noProject")}</SelectItem>
                      {projects.data?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>
                {t("btn.open")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {(["all", "pending", "review", "approved", "rejected", "deferred"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
              filter === s
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {s === "all" ? t("common.all") : DECISION_STATUS_LABEL[s as DecisionStatus]}
            <span className="ml-1.5 opacity-60">
              {s === "all" ? (decisions.data?.length ?? 0) : (counts[s] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {rows.length === 0 && (
          <div className="text-center text-sm text-muted-foreground p-12 border border-dashed border-border rounded-xl">
            {t("page.decisions.empty")}
          </div>
        )}
        {rows.map((d: any) => (
          <div
            key={d.id}
            className="rounded-xl border border-border bg-card p-5 hover:border-accent/40 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`size-2 rounded-full ${IMPACT_DOT[d.impact as DecisionImpact]}`}
                  />
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[d.status as DecisionStatus]}`}
                  >
                    {DECISION_STATUS_LABEL[d.status as DecisionStatus]}
                  </span>
                  {d.projects && (
                    <Link
                      to="/projects/$slug"
                      params={{ slug: d.projects.slug }}
                      className="text-[11px] text-muted-foreground hover:text-accent inline-flex items-center gap-1"
                    >
                      <span
                        className="size-2 rounded-sm"
                        style={{ background: d.projects.color ?? "#0a2540" }}
                      />
                      {d.projects.name}
                    </Link>
                  )}
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="size-3" /> {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold tracking-tight">{d.title}</h3>
                {d.context && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.context}</p>
                )}
                {d.recommendation && (
                  <div className="mt-2 text-xs px-3 py-2 rounded-md bg-muted/40 border border-border">
                    <span className="font-semibold text-foreground/80">
                      {t("page.decisions.recommended")}
                    </span>{" "}
                    {d.recommendation}
                  </div>
                )}
              </div>
              {d.status === "pending" || d.status === "review" ? (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                    onClick={() => decide.mutate({ id: d.id, status: "approved" })}
                  >
                    <Check className="size-3.5" /> {t("btn.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
                    onClick={() => decide.mutate({ id: d.id, status: "rejected" })}
                  >
                    <X className="size-3.5" /> {t("btn.reject")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
