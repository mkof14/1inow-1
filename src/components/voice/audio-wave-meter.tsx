import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getMicAnalyser, getOutputAnalyser } from "@/lib/voice-audio-context";
import type { VoicePersona } from "@/lib/voice-persona";

type Props = {
  stream?: MediaStream | null;
  audio?: HTMLAudioElement | null;
  bars?: number;
  variant?: "input" | "output";
  persona?: VoicePersona | null;
  className?: string;
  enabled?: boolean;
};

/**
 * Real audio meter — reads AnalyserNode via DOM refs (~15fps), no React re-render loop.
 * No synthetic/fake wave animation.
 */
export function AudioWaveMeter({
  stream,
  audio,
  bars = 12,
  variant = "input",
  persona = null,
  className,
  enabled = true,
}: Props) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const frameSkipRef = useRef(0);

  useEffect(() => {
    const flat = () => {
      barRefs.current.forEach((el) => {
        if (el) el.style.height = "3px";
      });
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      frameSkipRef.current = 0;
    };

    if (!enabled) {
      flat();
      return stop;
    }

    let analyser: AnalyserNode | null = null;
    let freqData: Uint8Array | null = null;
    let timeData: Uint8Array | null = null;

    const resolveAnalyser = () => {
      return variant === "output"
        ? getOutputAnalyser(audio ?? null)
        : getMicAnalyser(stream ?? null);
    };

    const startLoop = () => {
      if (!analyser || !freqData || !timeData) return;
      stop();

      const tick = () => {
        if (!analyser || !freqData || !timeData) return;

        frameSkipRef.current += 1;
        if (frameSkipRef.current % 2 !== 0) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        let rms = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i]! - 128) / 128;
          rms += v * v;
        }
        rms = Math.sqrt(rms / timeData.length);

        const levels = bucketLevels(freqData, bars, rms);
        for (let i = 0; i < bars; i++) {
          const el = barRefs.current[i];
          if (!el) continue;
          el.style.height = `${Math.max(3, Math.round((levels[i] ?? 0) * 28))}px`;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    const attach = () => {
      analyser = resolveAnalyser();
      if (!analyser) {
        flat();
        return false;
      }
      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
      startLoop();
      return true;
    };

    if (attach()) {
      return stop;
    }

    if (variant === "output" && audio) {
      const onPlaying = () => {
        attach();
      };
      audio.addEventListener("playing", onPlaying);
      return () => {
        audio.removeEventListener("playing", onPlaying);
        stop();
      };
    }

    flat();
    return stop;
  }, [stream, audio, bars, enabled, variant]);

  const hasSource = variant === "output" ? Boolean(audio) : Boolean(stream);
  const live = enabled && hasSource;
  const isOutput = variant === "output";
  const outputTone =
    persona === "nova"
      ? "border-amber-400/50 bg-amber-500/10"
      : persona === "vera"
        ? "border-indigo-400/50 bg-indigo-500/10"
        : "border-violet-400/40 bg-violet-500/5";

  return (
    <div
      role="meter"
      aria-label={isOutput ? "Speaker level" : "Microphone level"}
      className={cn(
        "flex min-w-0 flex-1 items-end gap-[2px] rounded-xl border px-2 py-1.5 transition-colors duration-300",
        live
          ? isOutput
            ? outputTone
            : "border-emerald-400/45 bg-emerald-500/8"
          : "border-dashed border-border/80 bg-muted/20",
        className,
      )}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className={cn(
            "w-[3px] rounded-full transition-[height] duration-75",
            isOutput
              ? persona === "nova"
                ? "bg-amber-400/80"
                : persona === "vera"
                  ? "bg-indigo-400/80"
                  : "bg-violet-400/50"
              : live
                ? "bg-emerald-400/85"
                : "bg-muted-foreground/25",
          )}
          style={{ height: 3 }}
        />
      ))}
    </div>
  );
}

function bucketLevels(data: Uint8Array, bars: number, rms: number) {
  const next = new Array(bars).fill(0);
  const binSize = Math.max(1, Math.floor(data.length / bars));
  const rmsBoost = Math.min(1, rms * 4.5);

  for (let i = 0; i < bars; i++) {
    let sum = 0;
    for (let j = 0; j < binSize; j++) sum += data[i * binSize + j] ?? 0;
    const freq = sum / binSize / 255;
    next[i] = Math.min(1, freq * 0.65 + rmsBoost * 0.55);
  }
  return next;
}

export default AudioWaveMeter;
