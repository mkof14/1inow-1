import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMessages, fetchReactions, markChannelRead, type Channel } from "@/lib/comm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MessageItem } from "./message-item";
import { MessageComposer } from "./message-composer";
import { Hash, Lock, Globe, Pin } from "lucide-react";

export function MessageStream({
  channel, onOpenThread,
}: {
  channel: Channel;
  onOpenThread: (id: string) => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", channel.id, null],
    queryFn: () => fetchMessages(channel.id, null),
  });
  const ids = messages.map((m) => m.id);
  const { data: reactions = [] } = useQuery({
    queryKey: ["reactions", channel.id, ids.join(",")],
    queryFn: () => fetchReactions(ids),
    enabled: ids.length > 0,
  });

  // Realtime: new messages & reactions for this channel
  useEffect(() => {
    const ch = supabase
      .channel(`stream-${channel.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` },
          () => qc.invalidateQueries({ queryKey: ["messages", channel.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" },
          () => qc.invalidateQueries({ queryKey: ["reactions", channel.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channel.id, qc]);

  // Mark read on focus / when messages load
  useEffect(() => {
    if (messages.length > 0) markChannelRead(channel.id).catch(() => {});
  }, [channel.id, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const Icon = channel.type === "company" ? Globe : channel.type === "private" ? Lock : Hash;
  const pinned = messages.filter((m) => m.pinned_at);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      <div className="h-14 border-b border-border px-5 flex items-center gap-3 bg-card/60 backdrop-blur sticky top-0 z-10">
        <Icon className="size-4 text-muted-foreground" />
        <div>
          <div className="text-sm font-semibold leading-tight">{channel.name}</div>
          {channel.description && <div className="text-xs text-muted-foreground leading-tight">{channel.description}</div>}
        </div>
      </div>

      {pinned.length > 0 && (
        <div className="border-b border-border bg-accent/5 px-5 py-2 text-xs flex items-center gap-2 text-muted-foreground">
          <Pin className="size-3 text-accent" /> {pinned.length} pinned
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground p-8 text-center">
            No messages yet. Be the first to say hi 👋
          </div>
        ) : (
          <div className="py-3">
            {messages.map((m) => (
              <MessageItem
                key={m.id}
                m={m}
                isOwn={m.author_id === user?.id}
                reactions={reactions as { emoji: string; user_id: string; message_id: string }[]}
                onOpenThread={onOpenThread}
                projectId={channel.project_id}
              />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border bg-card/60">
        <MessageComposer channelId={channel.id} placeholder={`Message #${channel.name}`} />
      </div>
    </div>
  );
}