import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markNotification, markAllRead } from "@/lib/wave1";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, CheckCheck, Inbox as InboxIcon } from "lucide-react";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SignalWave } from "@/components/icons/compass-icons";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const markMut = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: { read_at?: string | null; resolved_at?: string | null } }) =>
      markNotification(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const allMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <PageSkeleton />;
  const unread = data.filter((n) => !n.read_at);
  const resolved = data.filter((n) => n.resolved_at);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        icon={<SignalWave size={44} />}
        title={t("inbox.title")}
        subtitle={t("inbox.unread").replace("{n}", String(unread.length))}
        actions={
          <Button variant="outline" size="sm" onClick={() => allMut.mutate()} disabled={unread.length === 0} className="shrink-0">
            <CheckCheck className="size-4 mr-1.5 shrink-0" /> <span className="truncate">{t("common.markAllRead")}</span>
          </Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t("common.all")} <Badge variant="secondary" className="ml-2 h-5">{data.length}</Badge></TabsTrigger>
          <TabsTrigger value="unread">{t("common.unread")} <Badge variant="secondary" className="ml-2 h-5">{unread.length}</Badge></TabsTrigger>
          <TabsTrigger value="resolved">{t("common.resolved")} <Badge variant="secondary" className="ml-2 h-5">{resolved.length}</Badge></TabsTrigger>
        </TabsList>

        {(["all", "unread", "resolved"] as const).map((tab) => {
          const list = tab === "all" ? data : tab === "unread" ? unread : resolved;
          return (
            <TabsContent key={tab} value={tab} className="mt-5">
              {list.length === 0 ? (
                <EmptyState icon={InboxIcon} title={t("inbox.emptyTitle")} description={t("inbox.emptyDesc")} />
              ) : (
                <div className="rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft overflow-hidden fade-rise">
                  {list.map((n, idx) => (
                    <div
                      key={n.id}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className={`fade-rise px-4 py-3 border-b border-border/60 last:border-0 flex items-start gap-3 transition-colors hover:bg-accent/10 ${!n.read_at ? "bg-accent/5" : ""}`}
                    >
                      <div className={`size-2 rounded-full mt-2 shrink-0 ${!n.read_at ? "bg-accent" : "bg-transparent"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{n.title}</div>
                        {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{n.type.replace("_", " ")}</Badge>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!n.read_at && (
                          <Button size="icon" variant="ghost" onClick={() => markMut.mutate({ id: n.id, fields: { read_at: new Date().toISOString() } })}>
                            <Check className="size-4" />
                          </Button>
                        )}
                        {!n.resolved_at && (
                          <Button size="sm" variant="ghost" onClick={() => markMut.mutate({ id: n.id, fields: { resolved_at: new Date().toISOString(), read_at: n.read_at ?? new Date().toISOString() } })}>
                            {t("common.resolve")}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}