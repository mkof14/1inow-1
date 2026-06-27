import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AudioWaveMeter } from "@/components/voice/audio-wave-meter";
import type { VoicePhase } from "@/hooks/use-voice-session";
import { languageLabel } from "@/lib/voice-locale";

type Props = {
  phase: VoicePhase;
  lang: string;
  micStream: MediaStream | null;
  speakerOn: boolean;
  speakingAudio: HTMLAudioElement | null;
  error?: string | null;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  labels: {
    micOn: string;
    micOff: string;
    speakerOn: string;
    speakerOff: string;
    listening: string;
    transcribing: string;
    speaking: string;
    idle: string;
  };
  statusOverride?: string;
  compact?: boolean;
  className?: string;
};

export function VoiceControlBar({
  phase,
  lang,
  micStream,
  speakerOn,
  speakingAudio,
  error,
  onToggleMic,
  onToggleSpeaker,
  labels,
  statusOverride,
  compact = false,
  className,
}: Props) {
  const micActive = phase === "listening" || phase === "transcribing";
  const speaking = phase === "speaking";

  const statusText =
    statusOverride ??
    (phase === "listening"
      ? labels.listening
      : phase === "transcribing"
        ? labels.transcribing
        : phase === "speaking"
          ? labels.speaking
          : labels.idle);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-gradient-to-r from-background via-background to-accent/5 p-2 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={micActive ? "default" : "outline"}
          size="icon"
          className={cn(
            "size-9 shrink-0 rounded-full transition-all",
            micActive && "bg-accent text-accent-foreground shadow-md shadow-accent/25",
          )}
          onClick={onToggleMic}
          title={micActive ? labels.micOn : labels.micOff}
          aria-pressed={micActive}
        >
          {phase === "transcribing" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : micActive ? (
            <Mic className="size-4" />
          ) : (
            <MicOff className="size-4" />
          )}
        </Button>

        <AudioWaveMeter stream={micStream} variant="input" bars={compact ? 10 : 12} />

        <span
          className={cn(
            "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide sm:inline",
            micActive
              ? "bg-accent/15 text-accent"
              : speaking
                ? "bg-violet-500/15 text-violet-500"
                : "bg-muted text-muted-foreground",
          )}
        >
          {languageLabel(lang)}
        </span>

        <AudioWaveMeter
          audio={speakingAudio}
          active={speaking && !speakingAudio}
          variant="output"
          bars={compact ? 10 : 12}
        />

        <Button
          type="button"
          variant={speakerOn ? "outline" : "ghost"}
          size="icon"
          className={cn(
            "size-9 shrink-0 rounded-full",
            speakerOn && speaking && "border-violet-400/50 text-violet-500",
            !speakerOn && "text-muted-foreground",
          )}
          onClick={onToggleSpeaker}
          title={speakerOn ? labels.speakerOn : labels.speakerOff}
          aria-pressed={speakerOn}
        >
          {speakerOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </Button>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {(micActive || speaking) && (
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                micActive ? "bg-accent animate-pulse" : "bg-violet-400 animate-pulse",
              )}
            />
          )}
          <span className="truncate text-[10px] text-muted-foreground">{statusText}</span>
        </div>
        {error && (
          <span className="truncate text-[10px] text-destructive max-w-[45%]">{error}</span>
        )}
      </div>
    </div>
  );
}

export default VoiceControlBar;
