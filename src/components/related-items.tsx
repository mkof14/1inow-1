import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  listRelations,
  createRelation,
  deleteRelation,
  searchEntities,
  ENTITY_LABEL,
  ENTITY_TYPES,
  isResolvable,
  type EntityType,
  type RelatedItem,
} from "@/lib/relations";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Link2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function RelatedItems({
  sourceType,
  sourceId,
  title = "Related",
}: {
  sourceType: EntityType;
  sourceId: string;
  title?: string;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["relations", sourceType, sourceId],
    queryFn: () => listRelations(sourceType, sourceId),
    enabled: !!sourceId,
  });

  const unlink = useMutation({
    mutationFn: (relationId: string) => deleteRelation(relationId),
    onSuccess: () => {
      toast.success("Unlinked");
      qc.invalidateQueries({ queryKey: ["relations"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // group by type
  const groups = new Map<EntityType, RelatedItem[]>();
  for (const item of q.data ?? []) {
    const arr = groups.get(item.type) ?? [];
    arr.push(item);
    groups.set(item.type, arr);
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <span className="text-xs text-muted-foreground font-mono">{q.data?.length ?? 0}</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
              <Plus className="size-3.5" /> Link
            </Button>
          </DialogTrigger>
          <LinkDialog
            sourceType={sourceType}
            sourceId={sourceId}
            onClose={() => setOpen(false)}
            userId={user?.id}
          />
        </Dialog>
      </div>

      <div className="p-4 space-y-4">
        {q.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <p className="text-xs text-muted-foreground">
            No related items yet. Use Link to connect to other objects.
          </p>
        )}
        {Array.from(groups.entries()).map(([type, items]) => (
          <div key={type}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              {ENTITY_LABEL[type]} · {items.length}
            </div>
            <ul className="space-y-1">
              {items.map((it) => (
                <li
                  key={it.relationId}
                  className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 text-sm truncate">{it.label}</div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {it.href && (
                      <Link
                        to={it.href as any}
                        className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-accent"
                        title="Open"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    )}
                    <button
                      onClick={() => unlink.mutate(it.relationId)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Unlink"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkDialog({
  sourceType,
  sourceId,
  onClose,
  userId,
}: {
  sourceType: EntityType;
  sourceId: string;
  onClose: () => void;
  userId?: string;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<EntityType>("task");
  const [q, setQ] = useState("");

  const results = useQuery({
    queryKey: ["entity-search", type, q],
    queryFn: () => searchEntities(type, q),
    enabled: isResolvable(type),
  });

  const link = useMutation({
    mutationFn: (targetId: string) =>
      createRelation({
        sourceType,
        sourceId,
        targetType: type,
        targetId,
        createdBy: userId!,
      }),
    onSuccess: () => {
      toast.success("Linked");
      qc.invalidateQueries({ queryKey: ["relations"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Link related item</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <Select value={type} onValueChange={(v) => setType(v as EntityType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.filter(isResolvable).map((t) => (
              <SelectItem key={t} value={t}>
                {ENTITY_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-72 overflow-y-auto rounded-md border border-border divide-y divide-border">
          {(results.data ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground p-3">No matches.</p>
          )}
          {(results.data ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => link.mutate(r.id)}
              disabled={link.isPending || !userId}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-50"
            >
              {r.label || "Untitled"}
            </button>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
