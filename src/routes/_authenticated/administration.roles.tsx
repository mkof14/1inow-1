import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";
import {
  fetchPermissions,
  fetchRolePermissions,
  toggleRolePermission,
  ROLES,
  ROLE_LABELS,
  type AppRole,
  type Permission,
} from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/administration/roles")({
  component: RolesPage,
});

function RolesPage() {
  const t = useT();
  const qc = useQueryClient();
  const perms = useQuery({ queryKey: ["admin-permissions"], queryFn: fetchPermissions });
  const rps = useQuery({ queryKey: ["admin-role-permissions"], queryFn: fetchRolePermissions });

  const grants = useMemo(() => {
    const set = new Set<string>();
    (rps.data ?? []).forEach((rp) => set.add(`${rp.role}::${rp.permission_key}`));
    return set;
  }, [rps.data]);

  const toggle = useMutation({
    mutationFn: ({ role, key, granted }: { role: AppRole; key: string; granted: boolean }) =>
      toggleRolePermission(role, key, granted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-role-permissions"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    (perms.data ?? []).forEach((p) => {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    });
    return Array.from(map.entries());
  }, [perms.data]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("page.roles.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("page.roles.subtitle")}</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider text-muted-foreground sticky left-0 bg-muted/30 z-10 min-w-[220px]">
                  {t("tbl.permission")}
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    className="px-3 py-2.5 text-xs font-medium text-center whitespace-nowrap"
                  >
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(([cat, list]) => (
                <Fragment key={cat}>
                  <tr className="bg-muted/10">
                    <td
                      colSpan={ROLES.length + 1}
                      className="px-4 py-1.5 text-xs uppercase tracking-wider font-medium text-muted-foreground"
                    >
                      {cat}
                    </td>
                  </tr>
                  {list.map((p) => (
                    <tr key={p.key} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-2 sticky left-0 bg-background">
                        <div className="font-medium text-[13px]">{p.key}</div>
                        {p.description && (
                          <div className="text-[11px] text-muted-foreground">{p.description}</div>
                        )}
                      </td>
                      {ROLES.map((r) => {
                        const isSuper = r === "super_admin";
                        const checked = isSuper || grants.has(`${r}::${p.key}`);
                        return (
                          <td key={r} className="px-3 py-2 text-center">
                            <Checkbox
                              checked={checked}
                              disabled={isSuper || toggle.isPending}
                              onCheckedChange={(v) =>
                                toggle.mutate({ role: r, key: p.key, granted: !!v })
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
              {perms.isLoading && (
                <tr>
                  <td
                    colSpan={ROLES.length + 1}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!perms.isLoading && (perms.data?.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={ROLES.length + 1}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t("page.roles.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
