import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { fetchProfiles, fetchUserRoles, setUserRole, updateProfileStatus, ROLES, ROLE_LABELS, type AppRole } from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/administration/users")({
  component: UsersPage,
});

function UsersPage() {
  const t = useT();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const profiles = useQuery({ queryKey: ["admin-profiles"], queryFn: fetchProfiles });
  const roles = useQuery({ queryKey: ["admin-user-roles"], queryFn: fetchUserRoles });

  const roleByUser = useMemo(() => {
    const m = new Map<string, AppRole>();
    (roles.data ?? []).forEach((r) => m.set(r.user_id, r.role as AppRole));
    return m;
  }, [roles.data]);

  const setRole = useMutation({
    mutationFn: ({ user_id, role }: { user_id: string; role: AppRole }) => setUserRole(user_id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-user-roles"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => updateProfileStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profiles"] }); toast.success("Status updated"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const filtered = (profiles.data ?? []).filter((p) => {
    const s = q.toLowerCase();
    if (!s) return true;
    return (p.email ?? "").toLowerCase().includes(s) || (p.full_name ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("page.users.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("page.users.subtitle")}</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("page.users.searchPh")} className="pl-8" />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.user")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.email")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.role")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.status")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.language")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.joined")}</th>
                <th className="text-right px-4 py-2.5 font-medium">{t("tbl.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              )}
              {!profiles.isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {profiles.error ? t("page.users.signInPrompt") : t("page.users.empty")}
                </td></tr>
              )}
              {filtered.map((p) => {
                const role = roleByUser.get(p.id) ?? "guest";
                return (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full gradient-compass text-primary-foreground grid place-items-center text-[10px] font-semibold">
                          {(p.full_name ?? p.email ?? "U").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{p.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-2.5">
                      <Select value={role} onValueChange={(v) => setRole.mutate({ user_id: p.id, role: v as AppRole })}>
                        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status ?? "active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground uppercase text-xs">{p.language ?? "en"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => setStatus.mutate({ id: p.id, status: p.status === "active" ? "inactive" : "active" })}
                      >
                        {p.status === "active" ? t("btn.deactivate") : t("btn.activate")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}