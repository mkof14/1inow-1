import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChannels, type Channel } from "@/lib/comm";
import { ChannelList } from "@/components/comm/channel-list";
import { MessageStream } from "@/components/comm/message-stream";
import { ThreadPanel } from "@/components/comm/thread-panel";
import { EmptyState } from "@/components/empty-state";
import { MessageSquare, Radio, PanelRight, Users } from "lucide-react";
import { useSetPageContext } from "@/lib/ai-context";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/communication")({
  component: Communication,
});

function Communication() {
  const t = useT();
  const { data: channels = [] } = useQuery({ queryKey: ["channels"], queryFn: fetchChannels });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && channels.length > 0) setActiveId(channels[0].id);
  }, [channels, activeId]);

  const active: Channel | undefined = channels.find((c) => c.id === activeId);
  useSetPageContext(
    {
      route: "/communication",
      scope: "channel",
      title: active?.name,
      ids: { channelId: active?.id, threadId: thread ?? undefined },
    },
    [active?.id, thread],
  );

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col overflow-hidden">
      <div className="border-b border-border bg-background/70 px-4 py-3">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <Radio className="size-4 live-breathe" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">
                {active ? active.name : "Communication hub"}
              </span>
              <span className="hidden rounded-full border border-border bg-card px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex">
                {thread ? "Thread open" : active ? "Live channel" : "No channel"}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {active
                ? thread
                  ? "Resolve the thread, convert decisions into tasks, or close the loop."
                  : "Read the latest signal, reply clearly, or turn a message into a task."
                : "Create or select a channel to start structured communication."}
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <CommSignal icon={Users} label={`${channels.length} channels`} />
            <CommSignal icon={PanelRight} label={thread ? "thread focused" : "main stream"} />
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ChannelList activeId={activeId} onSelect={(c) => { setActiveId(c.id); setThread(null); }} />
        {active ? (
          <MessageStream channel={active} onOpenThread={(id) => setThread(id)} />
        ) : (
          <div className="flex-1 grid place-items-center">
            <EmptyState icon={MessageSquare} title={t("comm.noChannelTitle")} description={t("comm.noChannelDesc")} />
          </div>
        )}
        {active && thread && <ThreadPanel channel={active} threadRootId={thread} onClose={() => setThread(null)} />}
      </div>
    </div>
  );
}

function CommSignal({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground">
      <Icon className="size-3.5 text-accent" />
      {label}
    </div>
  );
}
