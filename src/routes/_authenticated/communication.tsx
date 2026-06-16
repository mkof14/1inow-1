import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChannels, type Channel } from "@/lib/comm";
import { ChannelList } from "@/components/comm/channel-list";
import { MessageStream } from "@/components/comm/message-stream";
import { ThreadPanel } from "@/components/comm/thread-panel";
import { EmptyState } from "@/components/empty-state";
import { MessageSquare } from "lucide-react";
import { useSetPageContext } from "@/lib/ai-context";

export const Route = createFileRoute("/_authenticated/communication")({
  component: Communication,
});

function Communication() {
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
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <ChannelList activeId={activeId} onSelect={(c) => { setActiveId(c.id); setThread(null); }} />
      {active ? (
        <MessageStream channel={active} onOpenThread={(id) => setThread(id)} />
      ) : (
        <div className="flex-1 grid place-items-center">
          <EmptyState icon={MessageSquare} title="No channel selected" description="Pick a channel on the left or create a new one to start the conversation." />
        </div>
      )}
      {active && thread && <ThreadPanel channel={active} threadRootId={thread} onClose={() => setThread(null)} />}
    </div>
  );
}