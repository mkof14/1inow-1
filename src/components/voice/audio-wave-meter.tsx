import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getMicAnalyser, getOutputAnalyser } from "@/lib/voice-audio-context";
import type { VoicePersona } from "@/lib/voice-persona";

export type MeterSignalState = "idle" | "quiet" | "active" | "hot";

type Props = {
  stream?: MediaStream | null;
  audio?: HTMLAudioElement | null;
  bars?: number;
  variant?: "input" | "output";
  persona?: VoicePersona | null;
  className?: string;
  enabled?: boolean;
  /** Show numeric level + signal badge */
  showLevel?: boolean;
  /** Activation threshold (0..1) for input meters */
  threshold?: number;
  label?: string;
  statusLabel?: string;
  onSignalChange?: (state: MeterSignalState, level: number) => void;
};

/**
 * Real audio meter — AnalyserNode → DOM refs (~20fps bars, ~4fps labels).
 */
export function AudioWaveMeter({
  stream,
  audio,
  bars = 16,
  variant = "input",
  persona = null,
  className,
  enabled = true,
  showLevel = false,
  threshold,
  label,
  statusLabel,
  onSignalChange,
}: Props) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const peakRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const peakHoldRef = useRef(0);
  const lastUiRef = useRef(0);
  const onSignalRef = useRef(onSignalChange);
  onSignalRef.current = onSignalChange;

  const [display, setDisplay] = useState<{ level: number; peak: number; signal: MeterSignalState }>({
    level: 0,
    peak: 0,
    signal: "idle",
  });

  useEffect(() => {
    const flat = () => {
      barRefs.current.forEach((el) => {
        if (el) el.style.height = "4px";
      });
      if (peakRef.current) peakRef.current.style.left = "0%";
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      frameRef.current = 0;
      peakHoldRef.current = 0;
    };

    if (!enabled) {
      flat();
      setDisplay({ level: 0, peak: 0, signal: "idle" });
      onSignalRef.current?.("idle", 0);
      return stop;
    }

    let analyser: AnalyserNode | null = null;
    let freqData: Uint8Array | null = null;
    let timeData: Uint8Array | null = null;

    const resolveAnalyser = () =>
      variant === "output" ? getOutputAnalyser(audio ?? null) : getMicAnalyser(stream ?? null);

    const signalFromLevel = (level: number): MeterSignalState => {
      const activeFloor = threshold ?? 0.1;
      const quietFloor = Math.max(0.02, activeFloor * 0.35);
      if (level >= 0.78) return "hot";
      if (level >= activeFloor) return "active";
      if (level >= quietFloor) return "quiet";
      return "idle";
    };

    const startLoop = () => {
      if (!analyser || !freqData || !timeData) return;
      stop();

      const tick = () => {
        if (!analyser || !freqData || !timeData) return;

        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        let rms = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i]! - 128) / 128;
          rms += v * v;
        }
        rms = Math.sqrt(rms / timeData.length);

        const levels = bucketLevels(freqData, bars, rms);
        const level = Math.min(1, levels.reduce((a, b) => a + b, 0) / bars);
        peakHoldRef.current = Math.max(level, peakHoldRef.current * 0.92);

        for (let i = 0; i < bars; i++) {
          const el = barRefs.current[i];
          if (!el) continue;
          const h = Math.max(4, Math.round((levels[i] ?? 0) * 36));
          el.style.height = `${h}px`;
          el.style.opacity = levels[i]! > 0.08 ? "1" : "0.35";
        }

        if (peakRef.current) {
          peakRef.current.style.left = `${Math.min(100, peakHoldRef.current * 100)}%`;
        }

        frameRef.current += 1;
        const now = performance.now();
        if (showLevel && now - lastUiRef.current > 120) {
          lastUiRef.current = now;
          const signal = signalFromLevel(level);
          setDisplay({ level, peak: peakHoldRef.current, signal });
          onSignalRef.current?.(signal, level);
        } else if (!showLevel && frameRef.current % 12 === 0) {
          onSignalRef.current?.(signalFromLevel(level), level);
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    const attach = () => {
      analyser = resolveAnalyser();
      if (!analyser) {
        flat();
        setDisplay({ level: 0, peak: 0, signal: "idle" });
        return false;
      }
      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
      startLoop();
      return true;
    };

    if (attach()) return stop;

    if (variant === "output" && audio) {
      const onPlaying = () => attach();
      audio.addEventListener("playing", onPlaying);
      return () => {
        audio.removeEventListener("playing", onPlaying);
        stop();
      };
    }

    flat();
    return stop;
  }, [stream, audio, bars, enabled, variant, showLevel, threshold]);

  const hasSource = variant === "output" ? Boolean(audio) : Boolean(stream);
  const live = enabled && hasSource;
  const isOutput = variant === "output";
  const hot = display.signal === "hot";
  const active = display.signal === "active" || hot;

  const shellTone = !live
    ? "border-dashed border-border/80 bg-muted/20"
    : isOutput
      ? persona === "nova"
        ? "border-amber-400/55 bg-gradient-to-b from-amber-500/15 to-amber-500/5 shadow-[inset_0_0_20px_rgba(245,158,11,0.08)]"
        : persona === "vera"
          ? "border-indigo-400/55 bg-gradient-to-b from-indigo-500/15 to-indigo-500/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.08)]"
          : "border-violet-400/40 bg-violet-500/5"
      : active
        ? "border-emerald-400/60 bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
        : "border-emerald-400/35 bg-emerald-500/5";

  const barTone = isOutput
    ? persona === "nova"
      ? "bg-amber-400"
      : persona === "vera"
        ? "bg-indigo-400"
        : "bg-violet-400"
    : hot
      ? "bg-emerald-300"
      : "bg-emerald-400";

  const signalBadge =
    !live
      ? statusLabel ?? "OFF"
      : active
        ? hot
          ? "HOT"
          : isOutput
            ? statusLabel ?? "LIVE"
            : statusLabel ?? "IN"
        : statusLabel ?? "···";

  return (
    <div className={cn("min-w-0 flex-1 space-y-1", className)}>
      {showLevel && (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {label ?? (isOutput ? "Voice out" : "Mic in")}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded px-1 py-px text-[8px] font-black uppercase tracking-wide",
                !live && "bg-muted text-muted-foreground",
                live && !active && "bg-muted/80 text-muted-foreground",
                live && active && !hot && (isOutput ? "bg-amber-500/90 text-white" : "bg-emerald-500/90 text-white"),
                hot && "bg-orange-500 text-white animate-pulse",
              )}
            >
              {signalBadge}
            </span>
            <span className="tabular-nums text-[10px] font-semibold text-foreground/80">
              {live ? `${Math.round(display.level * 100)}%` : "—"}
            </span>
          </div>
        </div>
      )}

      <div
        role="meter"
        aria-valuenow={live ? Math.round(display.level * 100) : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isOutput ? "Speaker level" : "Microphone level"}
        className={cn(
          "relative flex min-w-0 items-end gap-[3px] overflow-hidden rounded-xl border px-2.5 py-2 transition-all duration-200",
          shellTone,
          showLevel ? "h-14" : "h-9 py-1.5",
        )}
      >
        {live && (
          <span
            ref={peakRef}
            className={cn(
              "pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 -translate-x-1/2 rounded-full opacity-80",
              isOutput ? "bg-amber-200" : "bg-emerald-200",
            )}
            style={{ left: 0 }}
          />
        )}
        {Array.from({ length: bars }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className={cn(
              "relative z-[1] min-w-[3px] flex-1 rounded-full transition-[height,opacity] duration-75",
              live ? barTone : "bg-muted-foreground/20",
              live && hot && i > bars * 0.75 && "shadow-[0_0_6px_rgba(251,191,36,0.6)]",
            )}
            style={{ height: 4 }}
          />
        ))}
      </div>
    </div>
  );
}

function bucketLevels(data: Uint8Array, bars: number, rms: number) {
  const next = new Array(bars).fill(0);
  const binSize = Math.max(1, Math.floor(data.length / bars));
  const rmsBoost = Math.min(1, rms * 5.5);

  for (let i = 0; i < bars; i++) {
    let sum = 0;
    for (let j = 0; j < binSize; j++) sum += data[i * binSize + j] ?? 0;
    const freq = sum / binSize / 255;
    next[i] = Math.min(1, Math.pow(freq * 0.85 + rmsBoost * 0.65, 0.85));
  }
  return next;
}

export default AudioWaveMeter;
