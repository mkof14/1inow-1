import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchTasks } from "@/lib/queries";
import { TimelinePulse } from "@/components/icons/compass-icons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/calendar")({ component: TimelinePage });

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // monday-start
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function TimelinePage() {
  const t = useT();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor); d.setDate(anchor.getDate() + i); return d;
    });
  }, [anchor]);

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    (tasks.data ?? []).forEach((t: any) => {
      if (!t.due_date) return;
      const key = new Date(t.due_date).toDateString();
      (map[key] = map[key] ?? []).push(t);
    });
    return map;
  }, [tasks.data]);

  const today = new Date().toDateString();
  const monthLabel = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between mb-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="text-accent shrink-0"><TimelinePulse size={36} /></div>
          <div className="min-w-0">
            <h1 className="truncate text-xl sm:text-2xl font-semibold tracking-tight font-display">{t("page.calendar.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 sm:truncate">{t("page.calendar.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button onClick={() => { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); }}
            className="size-9 rounded-lg border border-border bg-card hover:bg-muted grid place-items-center transition-colors shrink-0">
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-medium font-display min-w-[100px] sm:min-w-[120px] text-center">{monthLabel}</div>
          <button onClick={() => { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); }}
            className="size-9 rounded-lg border border-border bg-card hover:bg-muted grid place-items-center transition-colors shrink-0">
            <ChevronRight className="size-4" />
          </button>
          <button onClick={() => setAnchor(startOfWeek(new Date()))}
            className="ml-1 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium whitespace-nowrap transition-colors shrink-0">
            {t("page.calendar.today")}
          </button>
        </div>
      </div>

      {/* Week grid — horizontal scroll when narrow */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pb-4">
        <div className="grid grid-cols-7 gap-3 min-w-[900px]">
          {days.map((d) => {
            const key = d.toDateString();
            const items = byDay[key] ?? [];
            const isToday = key === today;
            return (
              <div key={key} className={`rounded-2xl border min-h-[200px] lg:min-h-[300px] p-3 sm:p-4 transition-all duration-300 ${
                isToday ? "border-accent bg-accent/[0.06] shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]" : "border-border bg-card hover:border-accent/20"
              }`}>
                <div className="flex items-baseline justify-between mb-3 sm:mb-4">
                  <span className={`text-[10px] sm:text-xs uppercase tracking-widest font-medium ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span className={`text-xl sm:text-2xl font-display font-semibold ${isToday ? "text-accent" : ""}`}>{d.getDate()}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t: any) => (
                    <div key={t.id} className="group text-xs px-2.5 py-2 rounded-xl border border-border/80 bg-background/80 hover:border-accent/40 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer">
                      <div className="font-semibold leading-snug line-clamp-2">{t.title}</div>
                      {t.projects && (
                        <Link to="/projects/$slug" params={{ slug: t.projects.slug }}
                          className="text-[11px] text-muted-foreground hover:text-accent inline-flex items-center gap-1.5 mt-1.5 transition-colors">
                          <span className="size-1.5 rounded-full shrink-0" style={{ background: t.projects.color ?? "#0a2540" }} />
                          <span className="truncate max-w-[100px]">{t.projects.name}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="h-8 rounded-lg border border-dashed border-border/60 flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground/60">—</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}