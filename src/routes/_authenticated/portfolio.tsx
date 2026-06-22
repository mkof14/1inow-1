import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchProjects } from "@/lib/queries";
import { PortfolioCard, BrandMark } from "@/components/icons/compass-icons";
import { ArrowUpRight, Layers3, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/portfolio")({ component: PortfolioPage });

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  in_progress: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  planning: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  on_hold: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  archived: "bg-muted text-muted-foreground border-border",
};

function PortfolioPage() {
  const t = useT();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  const visible = useMemo(() => {
    const list = (projects.data ?? []).filter((p: any) => p.status !== "archived");
    if (filter === "active")
      return list.filter((p: any) => p.status === "active" || p.status === "in_progress");
    if (filter === "completed") return list.filter((p: any) => p.status === "completed");
    return list;
  }, [projects.data, filter]);

  const stats = useMemo(() => {
    const list = projects.data ?? [];
    return {
      total: list.length,
      active: list.filter((p: any) => p.status === "active" || p.status === "in_progress").length,
      completed: list.filter((p: any) => p.status === "completed").length,
      avgProgress: list.length
        ? Math.round(list.reduce((a: number, p: any) => a + (p.progress ?? 0), 0) / list.length)
        : 0,
    };
  }, [projects.data]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, any[]>();
    for (const project of visible) {
      const group = project.portfolio_group ?? project.category ?? "Portfolio";
      buckets.set(group, [...(buckets.get(group) ?? []), project]);
    }
    return [...buckets.entries()];
  }, [visible]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1500px] mx-auto fade-rise">
      {/* Hero */}
      <div className="surface-aurora shimmer-border rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-accent/10 pointer-events-none">
          <BrandMark size={300} />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
            <Sparkles className="size-3.5 signal-pulse" /> {t("portfolio.eyebrow")}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight mb-3 max-w-3xl">
            {t("portfolio.title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
            {t("portfolio.subtitle")}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-3xl">
            {[
              { label: t("portfolio.stat.total"), value: stats.total },
              { label: t("portfolio.stat.active"), value: stats.active },
              { label: t("portfolio.stat.completed"), value: stats.completed },
              { label: t("portfolio.stat.progress"), value: `${stats.avgProgress}%` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card/60 backdrop-blur p-3"
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  {s.label}
                </div>
                <div className="font-display text-2xl font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-card">
          {(
            [
              ["all", t("portfolio.filter.all")],
              ["active", t("portfolio.filter.active")],
              ["completed", t("portfolio.filter.completed")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id as any)}
              className={`px-3 h-8 rounded-md text-xs font-medium transition ${
                filter === id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Link
          to="/projects"
          className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1"
        >
          {t("portfolio.viewAll")} <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Grid */}
      <div className="space-y-8">
        {grouped.map(([group, groupProjects]) => (
          <section key={group} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg border border-border bg-card text-accent">
                  <Layers3 className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">{group}</h2>
                  <p className="text-xs text-muted-foreground">
                    {groupProjects.length} project{groupProjects.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupProjects.map((p: any) => {
                const color = p.color ?? "#22d3ee";
                const progress = p.progress ?? 0;
                const tags = p.tags ?? [];
                return (
                  <Link
                    key={p.id}
                    to="/projects/$slug"
                    params={{ slug: p.slug }}
                    className="group surface-aurora shimmer-border rounded-2xl p-5 hover:-translate-y-0.5 transition-transform"
                    style={{ ["--accent" as any]: color }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className="size-11 rounded-xl border border-border grid place-items-center"
                        style={{ background: `${color}20`, color }}
                      >
                        <PortfolioCard size={22} />
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_TONE[p.status] ?? STATUS_TONE.archived}`}
                      >
                        {(p.status as string).replace("_", " ")}
                      </span>
                    </div>
                    <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {p.category}
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-accent transition-colors">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {p.description}
                      </p>
                    )}

                    {tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                        <span>{t("portfolio.progress")}</span>
                        <span className="font-mono">{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, background: color }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {visible.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-12">
            {t("portfolio.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
