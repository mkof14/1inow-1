import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Live mic stream */
  stream?: MediaStream | null;
  /** TTS playback element for output visualization */
  audio?: HTMLAudioElement | null;
  /** Synthetic pulse when speaking without analyser */
  active?: boolean;
  bars?: number;
  variant?: "input" | "output";
  className?: string;
};

/**
 * Dual-mode audio meter: mic input (stream) or speaker output (audio element / pulse).
 */
export function AudioWaveMeter({
  stream,
  audio,
  active = false,
  bars = 12,
  variant = "input",
  className,
}: Props) {
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0));
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const pulseRef = useRef(0);

  useEffect(() => {
    const cleanup = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      analyserRef.current = null;
      dataRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };

    if (stream) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      src.connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        const a = analyserRef.current;
        const d = dataRef.current;
        if (!a || !d) return;
        a.getByteFrequencyData(d as Uint8Array<ArrayBuffer>);
        setLevels(bucketLevels(d, bars));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return cleanup;
    }

    if (audio) {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          const a = analyserRef.current;
          const d = dataRef.current;
          if (!a || !d) return;
          a.getByteFrequencyData(d as Uint8Array<ArrayBuffer>);
          setLevels(bucketLevels(d, bars));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return cleanup;
      } catch {
        // Element may already be wired — fall through to pulse
      }
    }

    if (active) {
      const tick = () => {
        pulseRef.current += 0.12;
        const next = Array.from({ length: bars }, (_, i) => {
          const wave = Math.sin(pulseRef.current + i * 0.55) * 0.5 + 0.5;
          return 0.15 + wave * 0.55;
        });
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return cleanup;
    }

    setLevels(Array(bars).fill(0));
    return cleanup;
  }, [stream, audio, active, bars]);

  const live = Boolean(stream || audio || active);
  const isOutput = variant === "output";

  return (
    <div
      role="meter"
      aria-label={isOutput ? "Speaker level" : "Microphone level"}
      className={cn(
        "flex h-8 flex-1 min-w-0 items-end gap-[2px] rounded-lg border px-2 py-1 transition-all duration-300",
        live
          ? isOutput
            ? "border-violet-400/40 bg-violet-500/5 shadow-[inset_0_0_12px_hsl(var(--accent)/0.06)]"
            : "border-accent/40 bg-accent/5 shadow-[inset_0_0_12px_hsl(var(--accent)/0.08)]"
          : "border-dashed border-border/80 bg-muted/20",
        className,
      )}
    >
      {levels.map((v, i) => {
        const h = Math.max(2, Math.round(v * 22));
        const color = isOutput
          ? v > 0.5
            ? "bg-violet-400"
            : v > 0.2
              ? "bg-violet-400/70"
              : live
                ? "bg-violet-400/35"
                : "bg-muted-foreground/25"
          : v > 0.78
            ? "bg-red-400"
            : v > 0.5
              ? "bg-amber-400"
              : v > 0.15
                ? "bg-emerald-400"
                : live
                  ? "bg-emerald-500/40"
                  : "bg-muted-foreground/25";
        return (
          <span
            key={i}
            className={cn("w-[3px] rounded-full transition-[height] duration-75", color)}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

function bucketLevels(data: Uint8Array, bars: number) {
  const next = new Array(bars).fill(0);
  const binSize = Math.max(1, Math.floor(data.length / bars));
  for (let i = 0; i < bars; i++) {
    let sum = 0;
    for (let j = 0; j < binSize; j++) sum += data[i * binSize + j] ?? 0;
    next[i] = sum / binSize / 255;
  }
  return next;
}

export default AudioWaveMeter;
