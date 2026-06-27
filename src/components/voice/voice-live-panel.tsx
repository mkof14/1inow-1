import { Mic, MicOff, Square, Volume2, VolumeX, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AudioWaveMeter } from "@/components/voice/audio-wave-meter";
import type { VoicePhase } from "@/hooks/use-voice-session";
import { languageLabel } from "@/lib/voice-locale";
import { SENSE_ASSETS } from "@/lib/sense-assets";

type Props = {
  phase: VoicePhase;
  lang: string;
  micStream: MediaStream | null;
  speakerOn: boolean;
  speakingAudio: HTMLAudioElement | null;
  error?: string | null;
  handsFreeActive?: boolean;
  conversationMode?: boolean;
  thinking?: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onStop: () => void;
  labels: {
    micOn: string;
    micOff: string;
    speakerOn: string;
    speakerOff: string;
    listening: string;
    transcribing: string;
    speaking: string;
    idle: string;
    handsFree?: string;
    tapMic?: string;
    stop?: string;
    thinking?: string;
    bargeIn?: string;
  };
  statusOverride?: string;
  compact?: boolean;
  className?: string;
};

export function VoiceLivePanel({
  phase,
  lang,
  micStream,
  speakerOn,
  speakingAudio,
  error,
  handsFreeActive = false,
  conversationMode = false,
  thinking = false,
  onToggleMic,
  onToggleSpeaker,
  onStop,
  labels,
  statusOverride,
  compact = false,
  className,
}: Props) {
  const micActive = phase === "listening" || phase === "transcribing";
  const speaking = phase === "speaking";
  const live = micActive || speaking || thinking || handsFreeActive;

  const statusText =
    statusOverride ??
    (thinking
      ? labels.thinking ?? "Thinking…"
      : phase === "listening"
        ? labels.listening
        : phase === "transcribing"
          ? labels.transcribing
          : phase === "speaking"
            ? labels.speaking
            : handsFreeActive
              ? labels.handsFree ?? labels.listening
              : labels.idle);

  const orbTone = speaking
    ? "from-violet-500/30 via-fuchsia-500/20 to-violet-600/10 shadow-violet-500/25"
    : micActive
      ? "from-emerald-500/35 via-teal-400/20 to-cyan-500/10 shadow-emerald-500/30"
      : thinking
        ? "from-amber-400/30 via-orange-400/15 to-amber-500/10 shadow-amber-500/25"
        : handsFreeActive
          ? "from-accent/30 via-accent/15 to-accent/5 shadow-accent/20"
          : "from-muted/40 via-muted/20 to-transparent shadow-none";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300",
        live
          ? "border-accent/35 bg-gradient-to-br from-background via-background to-accent/5 shadow-lg shadow-accent/10"
          : "border-border/80 bg-muted/20",
        className,
      )}
    >
      {live && (
        <div
          className={cn(
            "pointer-events-none absolute -inset-8 opacity-60 blur-2xl transition-colors duration-500",
            speaking && "bg-violet-500/20",
            micActive && "bg-emerald-500/15",
            thinking && "bg-amber-400/15",
          )}
        />
      )}

      <div className={cn("relative p-3", compact ? "space-y-2" : "space-y-3")}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div
              className={cn(
                "grid size-14 place-items-center rounded-full bg-gradient-to-br ring-2 ring-white/10 transition-all duration-300",
                orbTone,
                live && "animate-[pulse_2.4s_ease-in-out_infinite]",
              )}
            >
              <img
                src={SENSE_ASSETS.sense}
                alt=""
                className={cn("rounded-full object-cover", compact ? "size-9" : "size-10")}
              />
            </div>
            {live && (
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
                  speaking ? "bg-violet-500" : micActive ? "bg-emerald-500" : "bg-amber-400",
                  "animate-pulse",
                )}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-foreground">Sense Voice</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  micActive && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  speaking && "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                  thinking && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                  !micActive && !speaking && !thinking && "bg-muted text-muted-foreground",
                )}
              >
                {languageLabel(lang)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{statusText}</p>
            {!handsFreeActive && !micActive && phase === "idle" && conversationMode && (
              <p className="mt-0.5 text-[10px] text-accent">{labels.tapMic ?? "Tap mic to start"}</p>
            )}
          </div>

          {(speaking || thinking) && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="shrink-0 gap-1.5 rounded-full px-3 shadow-md"
              onClick={onStop}
              title={labels.stop ?? "Stop"}
            >
              <Square className="size-3 fill-current" />
              <span className="text-xs font-semibold">{labels.stop ?? "Stop"}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={micActive || handsFreeActive ? "default" : "outline"}
            size="icon"
            className={cn(
              "size-11 shrink-0 rounded-full transition-all",
              (micActive || handsFreeActive) && "bg-accent text-accent-foreground shadow-lg shadow-accent/30",
            )}
            onClick={onToggleMic}
            aria-pressed={micActive || handsFreeActive}
          >
            {phase === "transcribing" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : micActive || handsFreeActive ? (
              <Mic className="size-5" />
            ) : (
              <MicOff className="size-5" />
            )}
          </Button>

          <AudioWaveMeter stream={micStream} variant="input" bars={compact ? 14 : 18} className="h-10" />

          <AudioWaveMeter
            audio={speakingAudio}
            variant="output"
            bars={compact ? 14 : 18}
            enabled={Boolean(speakingAudio)}
            className="h-10"
          />

          <Button
            type="button"
            variant={speakerOn ? "outline" : "ghost"}
            size="icon"
            className={cn(
              "size-11 shrink-0 rounded-full",
              speakerOn && speaking && "border-violet-400/50 text-violet-500 shadow-violet-500/20",
            )}
            onClick={onToggleSpeaker}
            aria-pressed={speakerOn}
          >
            {speakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <Sparkles className="size-3 text-accent" />
          <span>{labels.bargeIn ?? "Say Stop to interrupt · pause after speaking sends automatically"}</span>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default VoiceLivePanel;
