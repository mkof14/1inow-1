import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchFavorites } from "@/lib/wave1";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        icon={<Star className="size-10 fill-accent/20" />}
        title={t("favorites.title")}
        subtitle={t("favorites.subtitle")}
      />
      {data.length === 0 ? (
        <EmptyState icon={Star} title={t("favorites.emptyTitle")} description={t("favorites.emptyDesc")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((f, idx) => (
            <Link
              key={f.id}
              to={f.entity_type === "project" ? "/projects" : "/tasks"}
              style={{ animationDelay: `${idx * 40}ms` }}
              className="fade-rise group relative rounded-2xl border border-border bg-card surface-aurora shimmer-border ring-accent-soft p-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent/80">{f.entity_type}</div>
              <div className="font-medium mt-1 truncate group-hover:text-accent transition-colors">{f.label ?? f.entity_id}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}