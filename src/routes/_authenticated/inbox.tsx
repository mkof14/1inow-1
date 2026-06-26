import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markNotification, markAllRead } from "@/lib/wave1";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  FileText,
  FolderKanban,
  Inbox as InboxIcon,
  ListChecks,
  Mic,
  Trash2,
} from "lucide-react";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SignalWave } from "@/components/icons/compass-icons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createProjectRecord, createTaskRecord } from "@/lib/project-task-engine";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import {
  clearProcessedVoiceInboxItems,
  deleteVoiceInboxItem,
  getVoiceInboxItems,
  subscribeVoiceInbox,
  updateVoiceInboxItem,
  type VoiceInboxItem,
  type VoiceInboxKind,
} from "@/lib/voice-intake";
import { toast } from "sonner";

const VOICE_KIND_OPTIONS: VoiceInboxKind[] = [
  "task",
  "project",
  "note",
  "reminder",
  "risk",
  "search",
  "navigation",
  "unknown",
];
const VOICE_FILTERS: Array<VoiceInboxKind | "all"> = [
  "all",
  "task",
  "project",
  "risk",
  "note",
  "reminder",
  "unknown",
];

const KIND_META: Record<VoiceInboxKind, { label: string; tone: string; action: string }> = {
  task: {
    label: "Task",
    tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
    action: "Create task",
  },
  project: {
    label: "Project",
    tone: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-200",
    action: "Create project",
  },
  note: {
    label: "Note",
    tone: "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-200",
    action: "Keep note",
  },
  reminder: {
    label: "Reminder",
    tone: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200",
    action: "Review reminder",
  },
  risk: {
    label: "Risk",
    tone: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200",
    action: "Create risk task",
  },
  search: {
    label: "Search",
    tone: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-200",
    action: "Review search",
  },
  navigation: {
    label: "Navigation",
    tone: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-200",
    action: "Review route",
  },
  unknown: {
    label: "Decide",
    tone: "border-border bg-muted/40 text-muted-foreground",
    action: "Decide type",
  },
};

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });
  const [voiceItems, setVoiceItems] = useState<VoiceInboxItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  useEffect(() => {
    const refresh = () => setVoiceItems(getVoiceInboxItems());
    refresh();
    return subscribeVoiceInbox(refresh);
  }, []);

  const markMut = useMutation({
    mutationFn: ({
      id,
      fields,
    }: {
      id: string;
      fields: { read_at?: string | null; resolved_at?: string | null };
    }) => markNotification(id, fields),
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => allMut.mutate()}
            disabled={unread.length === 0}
            className="shrink-0"
          >
            <CheckCheck className="size-4 mr-1.5 shrink-0" />{" "}
            <span className="truncate">{t("common.markAllRead")}</span>
          </Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            {t("common.all")}{" "}
            <Badge variant="secondary" className="ml-2 h-5">
              {data.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            {t("common.unread")}{" "}
            <Badge variant="secondary" className="ml-2 h-5">
              {unread.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            {t("common.resolved")}{" "}
            <Badge variant="secondary" className="ml-2 h-5">
              {resolved.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="voice">
            Voice{" "}
            <Badge variant="secondary" className="ml-2 h-5">
              {voiceItems.filter((item) => item.status === "new").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="mt-5">
          <VoiceInboxPanel
            items={voiceItems}
            onChanged={() => setVoiceItems(getVoiceInboxItems())}
          />
        </TabsContent>

        {(["all", "unread", "resolved"] as const).map((tab) => {
          const list = tab === "all" ? data : tab === "unread" ? unread : resolved;
          return (
            <TabsContent key={tab} value={tab} className="mt-5">
              {list.length === 0 ? (
                <EmptyState
                  icon={InboxIcon}
                  title={t("inbox.emptyTitle")}
                  description={t("inbox.emptyDesc")}
                />
              ) : (
                <div className="rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft overflow-hidden fade-rise">
                  {list.map((n, idx) => (
                    <div
                      key={n.id}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className={`fade-rise px-4 py-3 border-b border-border/60 last:border-0 flex items-start gap-3 transition-colors hover:bg-accent/10 ${!n.read_at ? "bg-accent/5" : ""}`}
                    >
                      <div
                        className={`size-2 rounded-full mt-2 shrink-0 ${!n.read_at ? "bg-accent" : "bg-transparent"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{n.title}</div>
                        {n.body && (
                          <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {n.type.replace("_", " ")}
                          </Badge>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!n.read_at && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              markMut.mutate({
                                id: n.id,
                                fields: { read_at: new Date().toISOString() },
                              })
                            }
                          >
                            <Check className="size-4" />
                          </Button>
                        )}
                        {!n.resolved_at && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              markMut.mutate({
                                id: n.id,
                                fields: {
                                  resolved_at: new Date().toISOString(),
                                  read_at: n.read_at ?? new Date().toISOString(),
                                },
                              })
                            }
                          >
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

function VoiceInboxPanel({ items, onChanged }: { items: VoiceInboxItem[]; onChanged: () => void }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<VoiceInboxKind | "all">("all");
  const active = items.filter((item) => item.status === "new");
  const processed = items.filter((item) => item.status !== "new");
  const visible = filter === "all" ? active : active.filter((item) => item.kind === filter);
  const counts = VOICE_FILTERS.reduce(
    (acc, kind) => ({
      ...acc,
      [kind]: kind === "all" ? active.length : active.filter((item) => item.kind === kind).length,
    }),
    {} as Record<VoiceInboxKind | "all", number>,
  );

  const markProcessed = (item: VoiceInboxItem) => {
    updateVoiceInboxItem(item.id, { status: "processed", processedAt: new Date().toISOString() });
    onChanged();
  };

  const remove = (item: VoiceInboxItem) => {
    deleteVoiceInboxItem(item.id);
    onChanged();
  };

  const createTask = async (item: VoiceInboxItem) => {
    try {
      await createTaskRecord({
        title: item.title,
        description: `Captured by voice: ${item.raw}`,
        priority: item.kind === "risk" ? "high" : "medium",
      });
      updateVoiceInboxItem(item.id, { status: "processed", processedAt: new Date().toISOString() });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      onChanged();
      toast.success("Task created from Voice Inbox");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    }
  };

  const createProject = async (item: VoiceInboxItem) => {
    try {
      await createProjectRecord({
        name: item.title || "Voice project",
        description: `Captured by voice: ${item.raw}`,
      });
      updateVoiceInboxItem(item.id, { status: "processed", processedAt: new Date().toISOString() });
      await qc.invalidateQueries({ queryKey: ["projects"] });
      onChanged();
      toast.success("Project created from Voice Inbox");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    }
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
              Fast capture for thoughts, tasks, projects, reminders, and risks. Keep it simple:
              review, create, or close.
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

      <div className="grid gap-3 md:grid-cols-4">
        <QueueMetric icon={ListChecks} label="Tasks" value={counts.task} tone="text-emerald-500" />
        <QueueMetric icon={AlertTriangle} label="Risks" value={counts.risk} tone="text-red-500" />
        <QueueMetric icon={FileText} label="Notes" value={counts.note} tone="text-teal-500" />
        <QueueMetric
          icon={FolderKanban}
          label="Projects"
          value={counts.project}
          tone="text-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {VOICE_FILTERS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setFilter(kind)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === kind
                ? "border-accent/45 bg-accent/15 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-accent/35 hover:text-foreground"
            }`}
          >
            {kind === "all" ? "All" : KIND_META[kind].label}
            <span className="ml-1.5 text-muted-foreground">{counts[kind]}</span>
          </button>
        ))}
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No voice captures"
          description="Use the floating microphone, say or type a thought, then save it to the inbox."
        />
      ) : (
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
              No items in this view.
            </div>
          )}
          {visible.map((item) => {
            const meta = KIND_META[item.kind];
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/35"
              >
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`capitalize ${meta.tone}`}>
                        {meta.label}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {item.confidence}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
                      <Input
                        value={item.title}
                        onChange={(event) => {
                          updateVoiceInboxItem(item.id, { title: event.target.value });
                          onChanged();
                        }}
                        aria-label="Voice capture title"
                      />
                      <Select
                        value={item.kind}
                        onValueChange={(value) => {
                          updateVoiceInboxItem(item.id, { kind: value as VoiceInboxKind });
                          onChanged();
                        }}
                      >
                        <SelectTrigger aria-label="Voice capture type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICE_KIND_OPTIONS.map((kind) => (
                            <SelectItem key={kind} value={kind} className="capitalize">
                              {kind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.summary}</p>
                  </div>
                </div>

                <div className="mb-3 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  {item.raw}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    Next: <span className="font-medium text-foreground">{meta.action}</span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => createTask(item)}
                      className="gap-1.5"
                    >
                      <ListChecks className="size-4" />
                      {item.kind === "risk" ? "Create risk task" : "Create task"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => createProject(item)}
                      className="gap-1.5"
                    >
                      <FolderKanban className="size-4" />
                      Create project
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => markProcessed(item)}
                    >
                      Done
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item)}
                      aria-label="Remove voice capture"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QueueMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Mic;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <Icon className={`size-5 ${tone}`} />
      </div>
    </div>
  );
}
