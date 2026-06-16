import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchFavorites } from "@/lib/wave1";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { Star } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const t = useT();
  const { data = [], isLoading } = useQuery({ queryKey: ["favorites"], queryFn: fetchFavorites });
  if (isLoading) return <PageSkeleton />;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{t("favorites.title")}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("favorites.subtitle")}</p>
      {data.length === 0 ? (
        <EmptyState icon={Star} title={t("favorites.emptyTitle")} description={t("favorites.emptyDesc")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((f) => (
            <Link
              key={f.id}
              to={f.entity_type === "project" ? "/projects" : "/tasks"}
              className="border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{f.entity_type}</div>
              <div className="font-medium mt-1 truncate">{f.label ?? f.entity_id}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}