import type { ReactNode } from "react";
import { useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Square, Volume2, VolumeX, Loader2, Sparkles, Zap, Shield, Radio, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AudioWaveMeter, type MeterSignalState } from "@/components/voice/audio-wave-meter";
import type { VoicePhase } from "@/hooks/use-voice-session";
import type { VoicePersona } from "@/lib/voice-persona";
import { languageLabel } from "@/lib/voice-locale";
import { SENSE_ASSETS } from "@/lib/sense-assets";
import { loadVoicePrefs } from "@/lib/voice-prefs";
import { getOfflineVoiceQueueCount } from "@/lib/voice-offline-queue";
import type { AmbientInsight } from "@/lib/voice-proactive";
import { formatPttKeyLabel } from "@/hooks/use-voice-ptt";

export type VoiceConsoleMode = "chat" | "commands";

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
  activePersona?: VoicePersona | null;
  mode?: VoiceConsoleMode;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onStop: () => void;
  onModeChange?: (mode: VoiceConsoleMode) => void;
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
    tabChat?: string;
    tabCommands?: string;
    novaRole?: string;
    veraRole?: string;
    micIn?: string;
    speakerOut?: string;
    novaSpeaking?: string;
    veraSpeaking?: string;
    novaListening?: string;
    veraListening?: string;
    meterIn?: string;
    meterOut?: string;
    meterLive?: string;
    meterQuiet?: string;
    meterHot?: string;
    fnHandsFree?: string;
    fnAutoSend?: string;
    fnBargeIn?: string;
  };
  statusOverride?: string;
  pttActive?: boolean;
  usingServerStt?: boolean;
  sttMode?: "auto" | "browser" | "server";
  ambientInsight?: AmbientInsight | null;
  onAmbientAction?: (insight: AmbientInsight) => void;
  className?: string;
};

export function VoiceUnifiedConsole({
  phase,
  lang,
  micStream,
  speakerOn,
  speakingAudio,
  error,
  handsFreeActive = false,
  conversationMode = false,
  thinking = false,
  activePersona = null,
  mode = "chat",
  onToggleMic,
  onToggleSpeaker,
  onStop,
  onModeChange,
  labels,
  statusOverride,
  pttActive = false,
  usingServerStt = false,
  sttMode = "auto",
  ambientInsight = null,
  onAmbientAction,
  className,
}: Props) {
  const micThreshold = loadVoicePrefs().threshold ?? 0.08;
  const pttKey = formatPttKeyLabel(loadVoicePrefs().pttKey);
  const [offlineQueued, setOfflineQueued] = useState(() => getOfflineVoiceQueueCount());

  useEffect(() => {
    const sync = () => setOfflineQueued(getOfflineVoiceQueueCount());
    window.addEventListener("1inow:voice-offline-queue", sync);
    window.addEventListener("online", sync);
    return () => {
      window.removeEventListener("1inow:voice-offline-queue", sync);
      window.removeEventListener("online", sync);
    };
  }, []);
  const micActive = phase === "listening" || phase === "transcribing";
  const speaking = phase === "speaking";
  const live = micActive || speaking || thinking || handsFreeActive;
  const bargeInListening = speaking && handsFreeActive && Boolean(micStream);
  const micMeterOn = Boolean(micStream) && (micActive || handsFreeActive);
  const outMeterOn = speaking && Boolean(speakingAudio);

  const [micSignal, setMicSignal] = useState<MeterSignalState>("idle");
  const onMicSignal = useCallback((state: MeterSignalState) => setMicSignal(state), []);

  const leadPersona: VoicePersona = mode === "commands" ? "nova" : "vera";
  const novaState = resolvePersonaState("nova", leadPersona, activePersona, micActive, speaking, thinking, mode);
  const veraState = resolvePersonaState("vera", leadPersona, activePersona, micActive, speaking, thinking, mode);

  const statusText =
    statusOverride ??
    (thinking
      ? labels.thinking ?? "Thinking…"
      : speaking && activePersona === "nova"
        ? labels.novaSpeaking ?? "Nova speaking…"
        : speaking && activePersona === "vera"
          ? labels.veraSpeaking ?? "Vera speaking…"
          : phase === "listening"
            ? leadPersona === "nova"
              ? labels.novaListening ?? labels.listening
              : labels.veraListening ?? labels.listening
            : phase === "transcribing"
              ? labels.transcribing
              : handsFreeActive
                ? labels.handsFree ?? labels.listening
                : labels.idle);

  const shellTone =
    speaking && activePersona === "nova"
      ? "border-amber-400/45 shadow-amber-500/15"
      : speaking && activePersona === "vera"
        ? "border-indigo-400/45 shadow-indigo-500/15"
        : micActive
          ? "border-emerald-400/40 shadow-emerald-500/10"
          : thinking
            ? "border-amber-400/30"
            : "border-border/80";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-muted/20 shadow-md transition-colors duration-300",
        shellTone,
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 transition-colors duration-300",
          speaking && activePersona === "nova" && "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500",
          speaking && activePersona === "vera" && "bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500",
          micActive && !speaking && "bg-gradient-to-r from-emerald-400 to-teal-400",
          thinking && !speaking && "bg-gradient-to-r from-amber-300 to-amber-500 animate-pulse",
        )}
      />

      <div className="relative z-10 space-y-3 p-3">
        {onModeChange && (
          <div className="grid grid-cols-2 gap-2">
            <ModeTab
              active={mode === "chat"}
              onClick={() => onModeChange("chat")}
              image={SENSE_ASSETS.vera}
              icon={<Shield className="size-3.5 shrink-0" />}
              label={labels.tabChat ?? "Chat · Vera"}
              sublabel={labels.veraRole ?? "Review · dialogue"}
              tone="vera"
            />
            <ModeTab
              active={mode === "commands"}
              onClick={() => onModeChange("commands")}
              image={SENSE_ASSETS.nova}
              icon={<Zap className="size-3.5 shrink-0" />}
              label={labels.tabCommands ?? "Commands · Nova"}
              sublabel={labels.novaRole ?? "Action · commands"}
              tone="nova"
            />
          </div>
        )}

        {ambientInsight && onAmbientAction && (
          <div className="flex items-start gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-2.5 py-2">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-snug text-foreground">{ambientInsight.message}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1.5 h-7 gap-1 rounded-full px-2.5 text-[10px]"
                onClick={() => onAmbientAction(ambientInsight)}
              >
                {ambientInsight.actionLabel}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <PersonaCard
            name="Nova"
            image={SENSE_ASSETS.nova}
            role={labels.novaRole ?? "Action · commands"}
            state={novaState}
            tone="nova"
          />
          <PersonaCard
            name="Vera"
            image={SENSE_ASSETS.vera}
            role={labels.veraRole ?? "Review · dialogue"}
            state={veraState}
            tone="vera"
          />
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-2.5 py-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Sense</span>
              <span className="rounded-md bg-background px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                {languageLabel(lang)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium text-foreground/90">{statusText}</p>
          </div>
          {live && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="relative z-20 shrink-0 gap-1 rounded-full px-3 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
            >
              <Square className="size-3 fill-current" />
              <span className="text-xs font-semibold">{labels.stop ?? "Stop"}</span>
            </Button>
          )}
        </div>

        {!handsFreeActive && !micActive && phase === "idle" && conversationMode && (
          <p className="text-center text-[10px] text-accent">{labels.tapMic ?? "Tap mic to start"}</p>
        )}

        <div className="relative z-20 space-y-2.5 rounded-xl border border-border/70 bg-muted/25 p-2.5">
          <div className="flex flex-wrap gap-1">
            <FnChip
              active={handsFreeActive}
              icon={<Radio className="size-2.5" />}
              label={labels.fnHandsFree ?? "Hands-free"}
            />
            <FnChip
              active={conversationMode}
              icon={<Waves className="size-2.5" />}
              label={labels.fnAutoSend ?? "Auto-send"}
            />
            <FnChip
              active={bargeInListening}
              icon={<Mic className="size-2.5" />}
              label={labels.fnBargeIn ?? "Barge-in"}
              tone="amber"
            />
            {pttActive && (
              <FnChip active icon={<Mic className="size-2.5" />} label={`PTT ${pttKey}`} tone="emerald" />
            )}
            {offlineQueued > 0 && (
              <FnChip active icon={<Radio className="size-2.5" />} label={`Queue ${offlineQueued}`} />
            )}
            {(sttMode === "server" || usingServerStt) && (
              <FnChip
                active
                icon={<Sparkles className="size-2.5" />}
                label={usingServerStt ? "Whisper" : "STT server"}
                tone="amber"
              />
            )}
          </div>

          <div className="flex items-stretch gap-2">
            <Button
              type="button"
              variant={micActive || handsFreeActive ? "default" : "outline"}
              size="icon"
              className={cn(
                "relative size-11 shrink-0 self-center rounded-full transition-shadow",
                (micActive || handsFreeActive) && "bg-emerald-600 text-white",
                micSignal === "active" && "ring-2 ring-emerald-400/70 shadow-[0_0_12px_rgba(16,185,129,0.45)]",
                micSignal === "hot" && "ring-2 ring-orange-400/80 shadow-[0_0_14px_rgba(251,146,60,0.5)]",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMic();
              }}
              aria-pressed={micActive || handsFreeActive}
            >
              {phase === "transcribing" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : micActive || handsFreeActive ? (
                <Mic className="size-4" />
              ) : (
                <MicOff className="size-4" />
              )}
            </Button>

            <AudioWaveMeter
              stream={micMeterOn ? micStream : null}
              variant="input"
              bars={18}
              enabled={micMeterOn}
              showLevel
              threshold={micThreshold}
              label={labels.meterIn ?? labels.micIn ?? "Mic in"}
              statusLabel={
                bargeInListening
                  ? labels.fnBargeIn ?? "BARGE"
                  : micActive
                    ? labels.meterLive ?? "LIVE"
                    : labels.meterQuiet ?? "···"
              }
              onSignalChange={onMicSignal}
            />
          </div>

          <div className="flex items-stretch gap-2">
            <AudioWaveMeter
              audio={speakingAudio}
              variant="output"
              persona={activePersona ?? leadPersona}
              bars={18}
              enabled={outMeterOn || (thinking && speakerOn)}
              showLevel
              label={labels.meterOut ?? labels.speakerOut ?? "Voice out"}
              statusLabel={
                !speakerOn
                  ? "MUTE"
                  : speaking
                    ? activePersona === "vera"
                      ? "VERA"
                      : "NOVA"
                    : thinking
                      ? "…"
                      : labels.meterQuiet ?? "READY"
              }
            />
            <Button
              type="button"
              variant={speakerOn ? "outline" : "ghost"}
              size="icon"
              className={cn(
                "size-11 shrink-0 self-center rounded-full",
                speaking && activePersona === "nova" && "border-amber-400 text-amber-600 ring-1 ring-amber-400/40",
                speaking && activePersona === "vera" && "border-indigo-400 text-indigo-600 ring-1 ring-indigo-400/40",
                outMeterOn && "shadow-[0_0_10px_rgba(99,102,241,0.25)]",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSpeaker();
              }}
              aria-pressed={speakerOn}
            >
              {speakerOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Sparkles className="size-3 shrink-0 text-accent" />
          <span>{labels.bargeIn}</span>
        </p>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

type PersonaState = "idle" | "lead" | "listening" | "speaking" | "thinking";

function resolvePersonaState(
  persona: VoicePersona,
  lead: VoicePersona,
  active: VoicePersona | null | undefined,
  micActive: boolean,
  speaking: boolean,
  thinking: boolean,
  mode: VoiceConsoleMode,
): PersonaState {
  if (speaking && active === persona) return "speaking";
  if (thinking && ((persona === "vera" && mode === "chat") || (persona === "nova" && mode === "commands")))
    return "thinking";
  if (micActive && persona === lead) return "listening";
  if (persona === lead) return "lead";
  return "idle";
}

function ModeTab({
  active,
  onClick,
  icon,
  image,
  label,
  sublabel,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  image: string;
  label: string;
  sublabel: string;
  tone: "nova" | "vera";
}) {
  const isNova = tone === "nova";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all duration-300",
        active
          ? isNova
            ? "border-amber-400/80 bg-gradient-to-br from-amber-500/25 to-orange-500/10 shadow-md shadow-amber-500/15 ring-2 ring-amber-400/50"
            : "border-indigo-400/80 bg-gradient-to-br from-indigo-500/25 to-violet-500/10 shadow-md shadow-indigo-500/15 ring-2 ring-indigo-400/50"
          : "border-border/70 bg-muted/30 opacity-75 hover:opacity-100 hover:bg-muted/50",
      )}
    >
      {active && (
        <span
          className={cn(
            "absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[7px] font-black uppercase tracking-wider text-white",
            isNova ? "bg-amber-500" : "bg-indigo-500",
          )}
        >
          ON
        </span>
      )}
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full ring-2",
          active ? (isNova ? "ring-amber-400" : "ring-indigo-400") : "ring-border/60",
        )}
      >
        <img src={image} alt="" className="size-7 rounded-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {icon}
          <span className={cn("truncate text-[11px] font-bold", active && (isNova ? "text-amber-950 dark:text-amber-50" : "text-indigo-950 dark:text-indigo-50"))}>
            {label}
          </span>
        </div>
        <p className="truncate text-[9px] text-muted-foreground">{sublabel}</p>
      </div>
    </button>
  );
}

function PersonaCard({
  name,
  image,
  role,
  state,
  tone,
}: {
  name: string;
  image: string;
  role: string;
  state: PersonaState;
  tone: "nova" | "vera";
}) {
  const isNova = tone === "nova";
  const active = state === "speaking" || state === "listening" || state === "thinking";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-2 transition-all duration-300",
        state === "speaking" &&
          (isNova
            ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20"
            : "border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-400/60 shadow-lg shadow-indigo-500/20"),
        state === "listening" &&
          (isNova
            ? "border-amber-400/70 bg-amber-500/10 ring-1 ring-amber-400/40"
            : "border-indigo-400/70 bg-indigo-500/10 ring-1 ring-indigo-400/40"),
        state === "thinking" &&
          (isNova ? "border-amber-300/60 bg-amber-500/8" : "border-indigo-300/60 bg-indigo-500/8"),
        state === "lead" && "border-border bg-muted/40 scale-[1.02]",
        state === "idle" && "border-border/60 bg-muted/20 opacity-45 scale-[0.98]",
      )}
    >
      {state === "speaking" && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 animate-pulse",
            isNova ? "bg-amber-400" : "bg-indigo-400",
          )}
        />
      )}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "relative grid size-11 shrink-0 place-items-center rounded-full ring-2",
            state === "speaking" && (isNova ? "ring-amber-400" : "ring-indigo-400"),
            state === "listening" && (isNova ? "ring-amber-400/60" : "ring-indigo-400/60"),
            state === "lead" && "ring-border",
            state === "idle" && "ring-border/50 grayscale-[0.3]",
          )}
        >
          <img src={image} alt="" className="size-8 rounded-full object-cover" />
          {active && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background animate-pulse",
                isNova ? "bg-amber-400" : "bg-indigo-400",
              )}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold">{name}</span>
            {state === "speaking" && (
              <span
                className={cn(
                  "rounded px-1 py-px text-[8px] font-black uppercase tracking-wide",
                  isNova ? "bg-amber-500 text-white" : "bg-indigo-500 text-white",
                )}
              >
                LIVE
              </span>
            )}
            {state === "listening" && (
              <span className="rounded bg-emerald-500/90 px-1 py-px text-[8px] font-black uppercase tracking-wide text-white">
                MIC
              </span>
            )}
            {state === "lead" && (
              <span className="rounded bg-muted-foreground/20 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
                READY
              </span>
            )}
          </div>
          <p className="truncate text-[9px] text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

export default VoiceUnifiedConsole;

function FnChip({
  active,
  icon,
  label,
  tone = "emerald",
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  tone?: "emerald" | "amber";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide transition-all",
        active
          ? tone === "amber"
            ? "border-amber-400/60 bg-amber-500/20 text-amber-900 dark:text-amber-100"
            : "border-emerald-400/60 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100"
          : "border-border/60 bg-background/50 text-muted-foreground opacity-60",
      )}
    >
      {icon}
      {label}
    </span>
  );
}
