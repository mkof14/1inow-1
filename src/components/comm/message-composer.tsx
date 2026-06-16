import { useState, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MESSAGE_TYPES, MESSAGE_TYPE_META, sendMessage, type MessageType } from "@/lib/comm";
import { useI18n } from "@/lib/i18n";
import { Send, Mic, Video, Paperclip } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function MessageComposer({ channelId, threadRootId = null, placeholder }: {
  channelId: string;
  threadRootId?: string | null;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [type, setType] = useState<MessageType>("normal");
  const qc = useQueryClient();

  const send = useMutation({
    mutationFn: () => sendMessage({ channel_id: channelId, body, message_type: type, thread_root_id: threadRootId, original_language: lang }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["messages", channelId, threadRootId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (body.trim()) send.mutate();
    }
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 border-b border-border/60 text-xs">
        <Select value={type} onValueChange={(v) => setType(v as MessageType)}>
          <SelectTrigger className="h-7 w-auto text-xs gap-1.5 border-0 bg-muted/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESSAGE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                <span className="mr-1.5">{MESSAGE_TYPE_META[t].icon}</span>{MESSAGE_TYPE_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-[10px] ml-auto">⌘↵ to send</span>
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder ?? "Write a message…"}
        rows={2}
        className="border-0 focus-visible:ring-0 resize-none"
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Attach file (coming soon)" disabled><Paperclip className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Voice message (coming soon)" disabled><Mic className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Video / Loom (coming soon)" disabled><Video className="size-3.5" /></Button>
        </div>
        <Button size="sm" onClick={() => send.mutate()} disabled={!body.trim() || send.isPending}>
          <Send className="size-3.5 mr-1.5" /> Send
        </Button>
      </div>
    </div>
  );
}