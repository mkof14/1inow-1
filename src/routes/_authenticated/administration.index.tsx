import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminStats, fetchAuditLogs } from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Users, Mail, Activity, AlertTriangle, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { resetDemoData, seedDemoData } from "@/lib/api/dev-tools.functions";

export const Route = createFileRoute("/_authenticated/administration/")({
  component: AdminDashboard,
});

function StatCard({ icon: Icon, label, value, hint, tone = "default" }: {
  icon: any; label: string; value: number | string; hint?: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass = tone === "warning" ? "text-amber-500" : tone === "success" ? "text-emerald-500" : "text-accent";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`size-4 ${toneClass}`} />
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function AdminDashboard() {
  const t = useT();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<"reset" | "seed" | "both" | null>(null);
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats });
  const audit = useQuery({ queryKey: ["admin-audit-recent"], queryFn: () => fetchAuditLogs(10) });
  const s = stats.data;

  const runReset = async () => {
    if (!confirm("Wipe all demo data (projects, tasks, channels, messages, notifications)? Your account is preserved.")) return;
    setBusy("reset");
    try { await resetDemoData(); await qc.invalidateQueries(); toast.success("Demo data cleared"); }
    catch (e: any) { toast.error(e?.message ?? "Reset failed"); }
    finally { setBusy(null); }
  };
  const runSeed = async () => {
    setBusy("seed");
    try { const r = await seedDemoData(); await qc.invalidateQueries();
      toast.success(`Seeded ${r.projects} projects, ${r.tasks} tasks, ${r.messages} messages`); }
    catch (e: any) { toast.error(e?.message ?? "Seed failed"); }
    finally { setBusy(null); }
  };
  const runFresh = async () => {
    if (!confirm("Reset and reload demo data in one click?")) return;
    setBusy("both");
    try {
      await resetDemoData();
      const r = await seedDemoData();
      await qc.invalidateQueries();
      toast.success(`Fresh demo ready — ${r.projects} projects, ${r.tasks} tasks`);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("page.adminHome.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("page.adminHome.subtitle")}</p>
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold">Developer Tools</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reset workspace data and reload a demo dataset in one click. Owner-only.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" disabled={busy !== null} onClick={runReset}>
              <RotateCcw className="size-4" /> {busy === "reset" ? "Resetting…" : "Reset"}
            </Button>
            <Button variant="outline" size="sm" disabled={busy !== null} onClick={runSeed}>
              <Sparkles className="size-4" /> {busy === "seed" ? "Seeding…" : "Seed Demo"}
            </Button>
            <Button size="sm" disabled={busy !== null} onClick={runFresh}>
              {busy === "both" ? "Working…" : "Reset & Reload"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label={t("page.users.title")} value={s?.totalUsers ?? "—"} />
        <StatCard icon={CheckCircle2} label={t("page.users.title") + " · " + t("status.online")} value={s?.activeUsers ?? "—"} tone="success" />
        <StatCard icon={Mail} label={t("page.invitations.title")} value={s?.pendingInvites ?? "—"} />
        <StatCard icon={Activity} label={t("page.audit.title")} value={s?.recentAuditCount ?? "—"} />
        <StatCard icon={AlertTriangle} label={t("page.audit.severity.warning")} value={s?.alerts ?? "—"} tone="warning" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("page.adminHome.recent")}</h2>
        </div>
        {audit.isLoading ? (
          <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
        ) : (audit.data?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">{t("page.adminHome.empty")}</div>
        ) : (
          <div className="divide-y divide-border">
            {audit.data!.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`size-2 rounded-full shrink-0 ${
                    a.severity === "critical" ? "bg-red-500" :
                    a.severity === "warning" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <span className="font-medium truncate">{a.action}</span>
                  {a.module && <span className="text-xs text-muted-foreground">· {a.module}</span>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}