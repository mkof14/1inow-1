import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Number of bars in the visual meter */
  bars?: number;
  /** Auto-start on mount (asks for permission) */
  autoStart?: boolean;
  /** Show start/stop control */
  showControls?: boolean;
  className?: string;
  /** Threshold (0..1) for "speech detected" callback */
  threshold?: number;
  onLevel?: (level: number) => void;
};

/**
 * Real microphone audio indicator using the Web Audio API.
 * Renders an animated bar meter driven by AnalyserNode RMS levels.
 */
export function MicIndicator({
  bars = 16,
  autoStart = false,
  showControls = true,
  className,
  threshold = 0.08,
  onLevel,
}: Props) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0));
  const [peak, setPeak] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
    setActive(false);
    setLevels(Array(bars).fill(0));
    setPeak(0);
  };

  const start = async () => {
    setError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone not supported in this browser");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      setActive(true);
      tick();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Microphone permission denied";
      setError(msg);
      stop();
    }
  };

  const tick = () => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;
    analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);

    // Bucket frequency bins into N bars (log-ish distribution)
    const next = new Array(bars).fill(0);
    const binSize = Math.floor(data.length / bars);
    let sumAll = 0;
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < binSize; j++) sum += data[i * binSize + j];
      const v = sum / binSize / 255;
      next[i] = v;
      sumAll += v;
    }
    const avg = sumAll / bars;
    setLevels(next);
    setPeak(avg);
    onLevel?.(avg);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (autoStart) start();
    const onVisibility = () => {
      if (document.hidden && streamRef.current) stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speaking = peak > threshold;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showControls && (
        <Button
          type="button"
          variant={active ? "default" : "outline"}
          size="sm"
          onClick={active ? stop : start}
          className="gap-2"
        >
          {active ? <Mic className="size-4" /> : <MicOff className="size-4" />}
          {active ? "Stop" : "Test mic"}
        </Button>
      )}
      <div
        className={cn(
          "flex h-9 items-end gap-[2px] rounded-md border bg-muted/30 px-2 py-1 transition-colors",
          active ? (speaking ? "border-accent" : "border-border") : "border-dashed border-muted-foreground/30",
        )}
        aria-label="Microphone level"
        role="meter"
        aria-valuenow={Math.round(peak * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {levels.map((v, i) => {
          const h = Math.max(2, Math.round(v * 28));
          return (
            <span
              key={i}
              className={cn(
                "w-[3px] rounded-sm transition-[height,background-color] duration-75",
                active
                  ? speaking
                    ? "bg-accent"
                    : "bg-foreground/60"
                  : "bg-muted-foreground/30",
              )}
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3.5" /> {error}
        </span>
      )}
      {active && !error && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(peak * 100)}%
        </span>
      )}
    </div>
  );
}