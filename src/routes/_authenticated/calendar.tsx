import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchTasks } from "@/lib/queries";
import { TimelinePulse } from "@/components/icons/compass-icons";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({ component: TimelinePage });

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // monday-start
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function TimelinePage() {
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
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="text-accent"><TimelinePulse size={44} /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-display">Timeline</h1>
            <p className="text-sm text-muted-foreground mt-1">Deadlines, milestones and decisions across the week.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); }}
            className="size-8 rounded-md border border-border bg-card hover:bg-muted grid place-items-center"><ChevronLeft className="size-4" /></button>
          <div className="text-sm font-medium font-display min-w-[140px] text-center">{monthLabel}</div>
          <button onClick={() => { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); }}
            className="size-8 rounded-md border border-border bg-card hover:bg-muted grid place-items-center"><ChevronRight className="size-4" /></button>
          <button onClick={() => setAnchor(startOfWeek(new Date()))}
            className="ml-1 h-8 px-3 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium">Today</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const key = d.toDateString();
          const items = byDay[key] ?? [];
          const isToday = key === today;
          return (
            <div key={key} className={`rounded-xl border min-h-[280px] p-3 transition ${
              isToday ? "border-accent bg-accent/5" : "border-border bg-card"
            }`}>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className={`text-2xl font-display ${isToday ? "text-accent" : ""}`}>{d.getDate()}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((t: any) => (
                  <div key={t.id} className="text-[11px] px-2 py-1.5 rounded-md border border-border bg-card/80 hover:border-accent/50 transition">
                    <div className="font-medium truncate">{t.title}</div>
                    {t.projects && (
                      <Link to="/projects/$slug" params={{ slug: t.projects.slug }}
                        className="text-[10px] text-muted-foreground hover:text-accent inline-flex items-center gap-1 mt-0.5">
                        <span className="size-1.5 rounded-sm" style={{ background: t.projects.color ?? "#0a2540" }} />
                        {t.projects.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}