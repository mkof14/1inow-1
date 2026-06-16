import { Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFavorites, toggleFavorite, type EntityType } from "@/lib/wave1";
import { cn } from "@/lib/utils";

export function StarButton({
  entityType, entityId, label, className,
}: { entityType: EntityType; entityId: string; label?: string; className?: string }) {
  const qc = useQueryClient();
  const { data: favs = [] } = useQuery({ queryKey: ["favorites"], queryFn: fetchFavorites });
  const isFav = favs.some((f) => f.entity_type === entityType && f.entity_id === entityId);
  const mut = useMutation({
    mutationFn: () => toggleFavorite(entityType, entityId, label),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); mut.mutate(); }}
      className={cn("p-1 rounded hover:bg-muted transition-colors", className)}
      aria-label={isFav ? "Unfavorite" : "Favorite"}
    >
      <Star className={cn("size-4", isFav ? "fill-accent text-accent" : "text-muted-foreground")} />
    </button>
  );
}