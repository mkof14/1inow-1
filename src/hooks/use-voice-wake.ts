import { useEffect, useRef } from "react";
import { loadVoicePrefs } from "@/lib/voice-prefs";
import { speechRecognitionSupported } from "@/lib/voice-stt-client";
import { toSpeechLocale } from "@/lib/voice-locale";

function normalizeWake(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function matchesWake(transcript: string, phrase: string) {
  const t = normalizeWake(transcript);
  const p = normalizeWake(phrase);
  if (!p) return false;
  return t.includes(p) || t.includes(p.replace("sense", "sens")) || t.includes("сенс");
}

/** Optional always-listening wake phrase — opens voice commands when detected. */
export function useVoiceWake(enabled: boolean, lang: string) {
  const recRef = useRef<any>(null);
  const restartingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !speechRecognitionSupported()) return;

    const prefs = loadVoicePrefs();
    if (!prefs.wakePhraseEnabled) return;

    const phrase = prefs.wakePhrase ?? "hey sense";
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const start = () => {
      if (recRef.current || restartingRef.current) return;
      try {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = toSpeechLocale(lang);
        rec.onresult = (event: any) => {
          let chunk = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            chunk += event.results[i][0].transcript;
          }
          if (matchesWake(chunk, phrase)) {
            try {
              rec.stop();
            } catch {}
            window.dispatchEvent(
              new CustomEvent("1inow:open-voice", {
                detail: { tab: "commands", startMic: true },
              }),
            );
          }
        };
        rec.onend = () => {
          recRef.current = null;
          if (!enabled) return;
          restartingRef.current = true;
          window.setTimeout(() => {
            restartingRef.current = false;
            start();
          }, 600);
        };
        rec.onerror = () => {
          recRef.current = null;
        };
        recRef.current = rec;
        rec.start();
      } catch {
        recRef.current = null;
      }
    };

    start();

    return () => {
      try {
        recRef.current?.stop?.();
      } catch {}
      recRef.current = null;
    };
  }, [enabled, lang]);
}
