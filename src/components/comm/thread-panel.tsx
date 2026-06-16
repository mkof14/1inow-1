import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMessages, fetchReactions, type Channel } from "@/lib/comm";
import { supabase } from "@/integrations/supabase/client";
import { MessageItem } from "./message-item";
import { MessageComposer } from "./message-composer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";

export function ThreadPanel({
  channel, threadRootId, onClose,
}: { channel: Channel; threadRootId: string; onClose: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useAuth();

  const root = useQuery({
    queryKey: ["message", threadRootId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("id", threadRootId)
        .maybeSingle();
      if (!data) return null;
      let profile = null;
      if (data.author_id) {
        const { data: p } = await supabase
          .from("profiles").select("id,full_name,avatar_url").eq("id", data.author_id).maybeSingle();
        profile = p ?? null;
      }
      return { ...data, profiles: profile };
    },
  });
  const replies = useQuery({
    queryKey: ["messages", channel.id, threadRootId],
    queryFn: () => fetchMessages(channel.id, threadRootId),
  });
  const ids = [threadRootId, ...(replies.data?.map((r) => r.id) ?? [])];
  const reactions = useQuery({
    queryKey: ["reactions", channel.id, ids.join(",")],
    queryFn: () => fetchReactions(ids),
    enabled: ids.length > 0,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`thread-${threadRootId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `thread_root_id=eq.${threadRootId}` },
          () => qc.invalidateQueries({ queryKey: ["messages", channel.id, threadRootId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadRootId, channel.id, qc]);

  return (
    <aside className="w-[380px] shrink-0 border-l border-border bg-card flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        <div>
          <div className="text-sm font-semibold">{t("comm.thread.title")}</div>
          <div className="text-xs text-muted-foreground">#{channel.name}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        {root.data && (
          <MessageItem
            m={root.data as never}
            isOwn={(root.data as { author_id: string }).author_id === user?.id}
            reactions={(reactions.data as never) ?? []}
            projectId={channel.project_id}
          />
        )}
        <div className="border-t border-border my-2 mx-4 text-[11px] uppercase tracking-wider text-muted-foreground py-1.5">
          {t("comm.replies").replace("{n}", String(replies.data?.length ?? 0))}
        </div>
        {replies.data?.map((m) => (
          <MessageItem
            key={m.id}
            m={m}
            isOwn={m.author_id === user?.id}
            reactions={(reactions.data as never) ?? []}
            projectId={channel.project_id}
          />
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <MessageComposer channelId={channel.id} threadRootId={threadRootId} placeholder={t("comm.thread.placeholder")} />
      </div>
    </aside>
  );
}