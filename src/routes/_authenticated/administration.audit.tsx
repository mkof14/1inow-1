import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { fetchAuditLogs } from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/administration/audit")({
  component: AuditPage,
});

function AuditPage() {
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState<string>("all");
  const logs = useQuery({ queryKey: ["admin-audit"], queryFn: () => fetchAuditLogs(500) });

  const filtered = useMemo(() => (logs.data ?? []).filter((l) => {
    if (severity !== "all" && l.severity !== severity) return false;
    if (q) {
      const s = q.toLowerCase();
      return l.action.toLowerCase().includes(s) ||
        (l.entity_type ?? "").toLowerCase().includes(s) ||
        (l.module ?? "").toLowerCase().includes(s);
    }
    return true;
  }), [logs.data, q, severity]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">All important admin and security actions.</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, modules…" className="pl-8" />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Time</th>
                <th className="text-left px-4 py-2.5 font-medium">Action</th>
                <th className="text-left px-4 py-2.5 font-medium">Module</th>
                <th className="text-left px-4 py-2.5 font-medium">Entity</th>
                <th className="text-left px-4 py-2.5 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!logs.isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No audit logs.</td></tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 font-medium">{l.action}</td>
                  <td className="px-4 py-2 text-muted-foreground">{l.module ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {l.entity_type ? `${l.entity_type}${l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={l.severity === "critical" ? "destructive" : l.severity === "warning" ? "secondary" : "outline"}>
                      {l.severity}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}