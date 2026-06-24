import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSystemSettings, updateSystemSetting, type SystemSetting } from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/administration/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: fetchSystemSettings });

  const update = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      updateSystemSetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, SystemSetting[]>();
    (settings.data ?? []).forEach((s) => {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    });
    return Array.from(map.entries());
  }, [settings.data]);

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">{t("page.systemSettings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("page.systemSettings.subtitle")}</p>
      </div>

      {settings.isLoading && (
        <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
      )}
      {!settings.isLoading && grouped.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {t("page.systemSettings.empty")}
        </Card>
      )}

      {grouped.map(([cat, list]) => (
        <Card key={cat} className="p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {cat}
          </h2>
          <div className="space-y-3">
            {list.map((s) => {
              const isBool = typeof s.value === "boolean";
              const isNumber = typeof s.value === "number";
              return (
                <div key={s.id} className="flex items-center justify-between gap-4 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{s.key}</div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {isBool && (
                      <Switch
                        checked={s.value as boolean}
                        onCheckedChange={(v) => update.mutate({ key: s.key, value: v })}
                      />
                    )}
                    {isNumber && (
                      <Input
                        type="number"
                        defaultValue={s.value as number}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n) && n !== s.value)
                            update.mutate({ key: s.key, value: n });
                        }}
                        className="w-24 h-8 text-right"
                      />
                    )}
                    {!isBool && !isNumber && (
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {JSON.stringify(s.value)}
                      </code>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
