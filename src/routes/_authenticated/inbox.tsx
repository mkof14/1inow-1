import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markNotification, markAllRead } from "@/lib/wave1";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, CheckCheck, FolderKanban, Inbox as InboxIcon, ListChecks, Mic, Trash2 } from "lucide-react";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SignalWave } from "@/components/icons/compass-icons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import {
  clearProcessedVoiceInboxItems,
  deleteVoiceInboxItem,
  getVoiceInboxItems,
  subscribeVoiceInbox,
  updateVoiceInboxItem,
  type VoiceInboxItem,
} from "@/lib/voice-intake";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  const [voiceItems, setVoiceItems] = useState<VoiceInboxItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  useEffect(() => {
    const refresh = () => setVoiceItems(getVoiceInboxItems());
    refresh();
    return subscribeVoiceInbox(refresh);
  }, []);

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
          <TabsTrigger value="voice">Voice <Badge variant="secondary" className="ml-2 h-5">{voiceItems.filter((item) => item.status === "new").length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="mt-5">
          <VoiceInboxPanel items={voiceItems} userId={user?.id} onChanged={() => setVoiceItems(getVoiceInboxItems())} />
        </TabsContent>

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

function VoiceInboxPanel({
  items,
  userId,
  onChanged,
}: {
  items: VoiceInboxItem[];
  userId?: string;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const active = items.filter((item) => item.status === "new");
  const processed = items.filter((item) => item.status !== "new");

  const markProcessed = (item: VoiceInboxItem) => {
    updateVoiceInboxItem(item.id, { status: "processed", processedAt: new Date().toISOString() });
    onChanged();
  };

  const remove = (item: VoiceInboxItem) => {
    deleteVoiceInboxItem(item.id);
    onChanged();
  };

  const createTask = async (item: VoiceInboxItem) => {
    if (!userId) {
      toast.error("Sign in required");
      return;
    }
    const { error } = await supabase.from("tasks").insert({
      title: item.title,
      description: `Captured by voice: ${item.raw}`,
      status: "todo",
      priority: item.kind === "risk" ? "high" : "medium",
      created_by: userId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    updateVoiceInboxItem(item.id, { status: "processed", processedAt: new Date().toISOString() });
    await qc.invalidateQueries({ queryKey: ["tasks"] });
    onChanged();
    toast.success("Task created from Voice Inbox");
  };

  const createProject = async (item: VoiceInboxItem) => {
    if (!userId) {
      toast.error("Sign in required");
      return;
    }
    const base = item.title || "voice-project";
    const slug = `${base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("projects").insert({
      name: item.title,
      slug,
      description: `Captured by voice: ${item.raw}`,
      status: "planning",
      priority: "medium",
      created_by: userId,
      owner_id: userId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    updateVoiceInboxItem(item.id, { status: "processed", processedAt: new Date().toISOString() });
    await qc.invalidateQueries({ queryKey: ["projects"] });
    onChanged();
    toast.success("Project created from Voice Inbox");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mic className="size-4 text-accent" />
              Voice Inbox
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Fast capture for thoughts, tasks, projects, reminders, and risks. Keep it simple: review, create, or close.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={processed.length === 0}
            onClick={() => {
              clearProcessedVoiceInboxItems();
              onChanged();
            }}
          >
            Clear processed
          </Button>
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No voice captures"
          description="Use the floating microphone, say or type a thought, then save it to the inbox."
        />
      ) : (
        <div className="space-y-3">
          {active.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/35">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">{item.kind}</Badge>
                    <Badge variant="secondary" className="capitalize">{item.confidence}</Badge>
                    <span className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.summary}</p>
                </div>
              </div>

              <div className="mb-3 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                {item.raw}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => createTask(item)} className="gap-1.5">
                  <ListChecks className="size-4" />
                  Create task
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => createProject(item)} className="gap-1.5">
                  <FolderKanban className="size-4" />
                  Create project
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => markProcessed(item)}>
                  Done
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(item)} aria-label="Remove voice capture">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
