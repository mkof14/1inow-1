import { useState } from "react";
import { type Message, MESSAGE_TYPE_META, editMessage, deleteMessage, pinMessage, toggleReaction, toggleSavedMessage, convertMessageToTask } from "@/lib/comm";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageSquare, Smile, Pin, Bookmark, Trash2, Pencil, Link as LinkIcon, CheckSquare, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const QUICK_REACTIONS = ["👍", "🎉", "❤️", "👀", "✅", "🚀"];

export function MessageItem({
  m, isOwn, reactions, onOpenThread, projectId,
}: {
  m: Message;
  isOwn: boolean;
  reactions: { emoji: string; user_id: string; message_id: string }[];
  onOpenThread?: (id: string) => void;
  projectId?: string | null;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.body);
  const meta = MESSAGE_TYPE_META[m.message_type];

  const myReactions = reactions.filter((r) => r.message_id === m.id);
  const grouped = myReactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  const author = m.profiles?.full_name ?? "Unknown";
  const initials = author.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";

  async function copyLink() {
    const url = `${window.location.origin}/communication?channel=${m.channel_id}&message=${m.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <div className={cn("group relative pl-4 pr-3 py-2 border-l-2 hover:bg-muted/30 transition-colors", meta.color)}>
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-primary/10 text-primary text-xs font-semibold grid place-items-center shrink-0">
          {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" className="size-8 rounded-full" /> : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 text-xs">
            <span className="font-semibold text-foreground text-sm">{author}</span>
            <span className="text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            {m.message_type !== "normal" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-muted text-muted-foreground">
                {meta.icon} {meta.label}
              </span>
            )}
            {m.pinned_at && <Pin className="size-3 text-accent" />}
            {m.edited_at && <span className="text-[10px] text-muted-foreground">(edited)</span>}
          </div>
          {editing ? (
            <div className="mt-1 space-y-2">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button size="sm" onClick={async () => {
                  await editMessage(m.id, draft); setEditing(false);
                  qc.invalidateQueries({ queryKey: ["messages", m.channel_id, m.thread_root_id] });
                }}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setDraft(m.body); setEditing(false); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground whitespace-pre-wrap break-words mt-0.5">{m.body}</div>
          )}
          {Object.keys(grouped).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(grouped).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={async () => { await toggleReaction(m.id, emoji); qc.invalidateQueries({ queryKey: ["reactions", m.channel_id] }); }}
                  className="text-xs bg-muted hover:bg-muted/70 rounded-full px-2 py-0.5 inline-flex items-center gap-1"
                >
                  <span>{emoji}</span><span className="text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover toolbar */}
      <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-md shadow-sm flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="size-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-0 p-1">
            <div className="flex gap-0.5">
              {QUICK_REACTIONS.map((e) => (
                <button key={e} className="hover:bg-muted rounded p-1 text-base" onClick={async () => {
                  await toggleReaction(m.id, e); qc.invalidateQueries({ queryKey: ["reactions", m.channel_id] });
                }}>{e}</button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {onOpenThread && !m.thread_root_id && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenThread(m.id)}><MessageSquare className="size-3.5" /></Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="size-3.5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={async () => {
              await pinMessage(m.id, !m.pinned_at);
              qc.invalidateQueries({ queryKey: ["messages"] });
            }}><Pin className="size-3.5 mr-2" />{m.pinned_at ? "Unpin" : "Pin"}</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { await toggleSavedMessage(m.id); toast.success("Saved"); }}>
              <Bookmark className="size-3.5 mr-2" />Save
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyLink}><LinkIcon className="size-3.5 mr-2" />Copy link</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => {
              try {
                await convertMessageToTask(m, projectId ?? null);
                toast.success("Task created");
                qc.invalidateQueries({ queryKey: ["tasks"] });
              } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
            }}><CheckSquare className="size-3.5 mr-2" />Convert to task</DropdownMenuItem>
            <DropdownMenuItem disabled><ScrollText className="size-3.5 mr-2" />Convert to decision <span className="ml-auto text-[10px] text-muted-foreground">C2</span></DropdownMenuItem>
            {isOwn && <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditing(true)}><Pencil className="size-3.5 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={async () => {
                await deleteMessage(m.id);
                qc.invalidateQueries({ queryKey: ["messages"] });
              }}><Trash2 className="size-3.5 mr-2" />Delete</DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}