import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { createTaskComment, deleteTaskComment, fetchTaskComments } from "@/lib/task-comment-engine";

export function TaskComments({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  const comments = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => fetchTaskComments(taskId),
    enabled: open,
  });

  const addComment = useMutation({
    mutationFn: () => createTaskComment({ taskId, body }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });

  const removeComment = useMutation({
    mutationFn: deleteTaskComment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-comments", taskId] }),
  });

  return (
    <div className="mt-2 border-t border-border/60 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <MessageSquare className="size-3" />
        {open ? "Hide comments" : "Comments"}
        {comments.data && comments.data.length > 0 ? ` (${comments.data.length})` : ""}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {(comments.data ?? []).map((comment: any) => {
            const author =
              comment.profiles?.full_name || comment.profiles?.email?.split("@")[0] || "User";
            const mine = comment.author_id === user?.id;
            return (
              <div key={comment.id} className="rounded-md bg-muted/50 px-2 py-1.5 text-xs group">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground/80">{author}</span>
                  {mine && (
                    <button
                      type="button"
                      onClick={() => removeComment.mutate(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-foreground/90">{comment.body}</p>
              </div>
            );
          })}

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            className="text-xs min-h-0"
          />
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!body.trim() || addComment.isPending}
            onClick={() => addComment.mutate()}
          >
            Post comment
          </Button>
        </div>
      )}
    </div>
  );
}
