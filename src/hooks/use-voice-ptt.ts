import { useEffect } from "react";
import { loadVoicePrefs } from "@/lib/voice-prefs";

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(
    el &&
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable),
  );
}

/** Global push-to-talk — hold configured key to speak. */
export function useVoicePtt() {
  useEffect(() => {
    let holding = false;

    const matchesPtt = (e: KeyboardEvent, code: string) =>
      e.code === code || e.key === code || (code === "Space" && e.code === "Space");

    const onDown = (e: KeyboardEvent) => {
      const pttKey = loadVoicePrefs().pttKey ?? "KeyV";
      if (!matchesPtt(e, pttKey)) return;
      if (isEditableTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (holding) return;
      holding = true;
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("1inow:voice-ptt", { detail: { phase: "down" } }));
    };

    const onUp = (e: KeyboardEvent) => {
      const pttKey = loadVoicePrefs().pttKey ?? "KeyV";
      if (!matchesPtt(e, pttKey)) return;
      if (!holding) return;
      holding = false;
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("1inow:voice-ptt", { detail: { phase: "up" } }));
    };

    const onBlur = () => {
      if (!holding) return;
      holding = false;
      window.dispatchEvent(new CustomEvent("1inow:voice-ptt", { detail: { phase: "up" } }));
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}

export function formatPttKeyLabel(code?: string) {
  if (!code || code === "Space") return "Space";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}
