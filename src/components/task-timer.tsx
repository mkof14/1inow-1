import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KEY = "dios.timers";

type TimerMap = Record<string, number>; // taskId -> start ms

function load(): TimerMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}
function save(m: TimerMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(m));
}

export function TaskTimer({ taskId, actualHours = 0, className }: { taskId: string; actualHours?: number; className?: string }) {
  const t = useT();
  const qc = useQueryClient();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, force] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const m = load();
    if (m[taskId]) setStartedAt(m[taskId]);
  }, [taskId]);

  useEffect(() => {
    if (startedAt) {
      tickRef.current = setInterval(() => force((n) => n + 1), 1000);
      return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }
  }, [startedAt]);

  const elapsedMs = startedAt ? Date.now() - startedAt : 0;
  const mm = String(Math.floor(elapsedMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, "0");

  async function start() {
    const m = load(); m[taskId] = Date.now(); save(m); setStartedAt(m[taskId]);
  }
  async function stop(e: React.MouseEvent) {
    e.stopPropagation();
    if (!startedAt) return;
    const hours = (Date.now() - startedAt) / 3_600_000;
    const m = load(); delete m[taskId]; save(m); setStartedAt(null);
    if (hours < 1 / 3600) return; // ignore < 1s
    const newTotal = Number((Number(actualHours ?? 0) + hours).toFixed(2));
    const { error } = await supabase.from("tasks").update({ actual_hours: newTotal }).eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    toast.success(t("timer.logged").replace("{h}", hours.toFixed(2)));
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); startedAt ? stop(e) : start(); }}
      title={startedAt ? t("timer.stop") : t("timer.start")}
      className={cn(
        "inline-flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-mono transition-colors",
        startedAt
          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
          : "bg-card/60 text-muted-foreground border border-border hover:text-accent hover:border-accent/40",
        className,
      )}
    >
      {startedAt ? <Square className="size-2.5 fill-current" /> : <Play className="size-2.5 fill-current" />}
      {startedAt ? `${mm}:${ss}` : (actualHours > 0 ? `${actualHours.toFixed(1)}h` : t("timer.start"))}
    </button>
  );
}