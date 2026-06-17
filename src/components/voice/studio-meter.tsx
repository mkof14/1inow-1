import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact studio-style audio level meter.
 * Real reaction to mic level via Web Audio API AnalyserNode.
 * Pass `stream` to drive it; null/undefined => idle bars.
 */
export function StudioMeter({
  stream,
  bars = 14,
  className,
}: {
  stream: MediaStream | null;
  bars?: number;
  className?: string;
}) {
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0));
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream) {
      setLevels(Array(bars).fill(0));
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    src.connect(analyser);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      const a = analyserRef.current;
      const d = dataRef.current;
      if (!a || !d) return;
      a.getByteFrequencyData(d as Uint8Array<ArrayBuffer>);
      const next = new Array(bars).fill(0);
      const binSize = Math.max(1, Math.floor(d.length / bars));
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < binSize; j++) sum += d[i * binSize + j] ?? 0;
        next[i] = sum / binSize / 255;
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      analyserRef.current = null;
      dataRef.current = null;
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [stream, bars]);

  const active = !!stream;
  return (
    <div
      role="meter"
      aria-label="Microphone level"
      className={cn(
        "flex h-7 items-end gap-[2px] rounded-md border bg-background/60 px-1.5 py-1 transition-colors",
        active ? "border-accent/40 shadow-[inset_0_0_0_1px_hsl(var(--accent)/0.08)]" : "border-dashed border-border",
        className,
      )}
    >
      {levels.map((v, i) => {
        const h = Math.max(2, Math.round(v * 20));
        // studio color zones
        const color =
          v > 0.78
            ? "bg-red-500"
            : v > 0.55
              ? "bg-amber-400"
              : v > 0.18
                ? "bg-emerald-400"
                : active
                  ? "bg-emerald-500/40"
                  : "bg-muted-foreground/30";
        return (
          <span
            key={i}
            className={cn("w-[3px] rounded-[1px] transition-[height] duration-75", color)}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

export default StudioMeter;