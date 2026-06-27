import type { VoicePlan } from "@/lib/voice-actions";

const STORAGE_KEY = "1inow:voice:last-executed:v1";

export function saveLastExecutedVoicePlan(plan: VoicePlan) {
  if (typeof window === "undefined") return;
  if (plan.intent === "unknown" || plan.intent === "show_notifications") return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        plan: {
          ...plan,
          executable: true,
          rawText: plan.rawText,
        },
      }),
    );
  } catch {}
}

export function loadLastExecutedVoicePlan(): VoicePlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; plan?: VoicePlan };
    if (!parsed?.plan) return null;
    if (parsed.savedAt && Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) return null;
    return { ...parsed.plan, executable: true };
  } catch {
    return null;
  }
}

export function isRepeatLastCommandPhrase(raw: string) {
  const n = raw.toLowerCase().replace(/[.,!?;:]+/g, " ").trim();
  const phrases = [
    "repeat last command",
    "run again",
    "run last command",
    "do that again",
    "повтори команду",
    "повтори последнюю команду",
    "ещё раз команда",
    "еще раз команда",
    "повтори останню команду",
    "repite el comando",
    "repetir comando",
    "letzten befehl wiederholen",
    "befehl wiederholen",
  ];
  return phrases.some((p) => n === p || n.startsWith(`${p} `) || n.endsWith(` ${p}`));
}
