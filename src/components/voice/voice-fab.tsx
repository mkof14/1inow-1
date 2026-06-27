import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { SENSE_ASSETS } from "@/lib/sense-assets";
import type { VoiceConsoleMode } from "@/components/voice/voice-unified-console";

type Props = {
  className?: string;
  hidden?: boolean;
};

/** Global voice entry — opens Commands · Nova and starts mic. */
export function VoiceFab({ className, hidden }: Props) {
  const t = useT();

  if (hidden) return null;

  const open = (tab: VoiceConsoleMode = "commands", startMic = true) => {
    window.dispatchEvent(
      new CustomEvent("1inow:open-voice", {
        detail: { tab, startMic },
      }),
    );
  };

  return (
    <div
      className={cn(
        "fixed z-40 flex flex-col items-end gap-2",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => open("chat", true)}
        className="hidden rounded-full border border-border/80 bg-card/95 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground shadow-md backdrop-blur-sm transition hover:border-indigo-400/50 hover:text-indigo-600 sm:inline-flex"
      >
        {t("voice.fab.chat", "Chat · Vera")}
      </button>

      <button
        type="button"
        onClick={() => open("commands", true)}
        aria-label={t("voice.fab.open", "Open voice commands")}
        title={t("voice.fab.open", "Voice commands")}
        className={cn(
          "group relative flex items-center gap-2 rounded-full border border-accent/40 bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-3 text-white shadow-lg shadow-emerald-900/25 transition-all",
          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/30 active:scale-[0.98]",
        )}
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping opacity-40 group-hover:opacity-60" />
        <span className="relative grid size-9 place-items-center rounded-full bg-white/15 ring-2 ring-white/30">
          <img src={SENSE_ASSETS.nova} alt="" className="size-7 rounded-full object-cover" />
          <Mic className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 p-0.5 text-white ring-2 ring-emerald-700" />
        </span>
        <span className="relative pr-1 text-left leading-tight">
          <span className="block text-[11px] font-black uppercase tracking-wide opacity-90">
            {t("voice.fab.label", "Sense")}
          </span>
          <span className="block text-xs font-semibold">{t("voice.fab.commands", "Speak")}</span>
        </span>
      </button>
    </div>
  );
}

export default VoiceFab;
