import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchEmailLogs, type EmailLog } from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/administration/email-logs")({
  component: EmailLogsPage,
});

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  sent: "default", queued: "secondary", failed: "destructive", suppressed: "outline",
};

function EmailLogsPage() {
  const t = useT();
  const logs = useQuery({ queryKey: ["admin-email-logs"], queryFn: () => fetchEmailLogs(500) });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<EmailLog | null>(null);

  const filtered = useMemo(() => {
    const data = logs.data ?? [];
    return data.filter(l =>
      (status === "all" || l.status === status) &&
      (!q || l.recipient_email.toLowerCase().includes(q.toLowerCase())
        || (l.template_slug ?? "").toLowerCase().includes(q.toLowerCase())
        || (l.subject ?? "").toLowerCase().includes(q.toLowerCase())));
  }, [logs.data, q, status]);

  const stats = useMemo(() => {
    const d = logs.data ?? [];
    return {
      total: d.length,
      sent: d.filter(l => l.status === "sent").length,
      queued: d.filter(l => l.status === "queued").length,
      failed: d.filter(l => l.status === "failed").length,
    };
  }, [logs.data]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("page.emailLogs.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("page.emailLogs.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("page.emailLogs.stat.total")} value={stats.total} />
        <StatCard label={t("page.emailLogs.stat.sent")} value={stats.sent} tone="success" />
        <StatCard label={t("page.emailLogs.stat.queued")} value={stats.queued} tone="muted" />
        <StatCard label={t("page.emailLogs.stat.failed")} value={stats.failed} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input className="max-w-xs" placeholder={t("page.emailLogs.searchPh")}
          value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
            <SelectItem value="sent">{t("page.emailLogs.stat.sent")}</SelectItem>
            <SelectItem value="queued">{t("page.emailLogs.stat.queued")}</SelectItem>
            <SelectItem value="failed">{t("page.emailLogs.stat.failed")}</SelectItem>
            <SelectItem value="suppressed">Suppressed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {logs.data?.length ?? 0}</span>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.recipient")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.template")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.subject")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.status")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.when")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              )}
              {!logs.isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  <Send className="size-5 mx-auto mb-2 opacity-50" /> {t("page.emailLogs.empty")}
                </td></tr>
              )}
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(l)}>
                  <td className="px-4 py-2.5">{l.recipient_email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {l.template_slug} <Badge variant="outline" className="ml-1">{l.language}</Badge>
                  </td>
                  <td className="px-4 py-2.5 truncate max-w-[280px]">{l.subject ?? "—"}</td>
                  <td className="px-4 py-2.5"><Badge variant={statusVariants[l.status] ?? "secondary"}>{l.status}</Badge></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("page.emailLogs.details")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row k="To" v={selected.recipient_email} />
              <Row k="Template" v={`${selected.template_slug ?? ""} (${selected.language ?? ""})`} />
              <Row k="Subject" v={selected.subject ?? "—"} />
              <Row k="Status" v={<Badge variant={statusVariants[selected.status] ?? "secondary"}>{selected.status}</Badge>} />
              <Row k="When" v={new Date(selected.created_at).toLocaleString()} />
              {selected.error_message && <Row k="Note" v={<span className="text-muted-foreground">{selected.error_message}</span>} />}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Variables</div>
                <pre className="text-xs bg-muted/30 p-2 rounded">{JSON.stringify(selected.variables, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-24 text-xs text-muted-foreground pt-0.5">{k}</div>
      <div className="flex-1">{v}</div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "danger" | "muted" }) {
  const color = tone === "success" ? "text-emerald-500" : tone === "danger" ? "text-destructive" : tone === "muted" ? "text-muted-foreground" : "";
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </Card>
  );
}