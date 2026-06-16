import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats, fetchAuditLogs } from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Users, Mail, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

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
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats });
  const audit = useQuery({ queryKey: ["admin-audit-recent"], queryFn: () => fetchAuditLogs(10) });
  const s = stats.data;
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and recent admin activity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Total users" value={s?.totalUsers ?? "—"} />
        <StatCard icon={CheckCircle2} label="Active users" value={s?.activeUsers ?? "—"} tone="success" />
        <StatCard icon={Mail} label="Pending invites" value={s?.pendingInvites ?? "—"} />
        <StatCard icon={Activity} label="Recent audit events" value={s?.recentAuditCount ?? "—"} />
        <StatCard icon={AlertTriangle} label="Security alerts" value={s?.alerts ?? "—"} tone="warning" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent admin actions</h2>
        </div>
        {audit.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (audit.data?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">No audit events yet.</div>
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