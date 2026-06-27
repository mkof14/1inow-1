import { supabase } from "@/integrations/supabase/client";
import { NOVA_TTS_VOICE, VERA_TTS_VOICE, splitNovaVeraSpeech } from "@/lib/sense-personas";
import { loadVoicePrefs } from "@/lib/voice-prefs";

export async function playServerTts(
  text: string,
  lang: string,
  onAudio?: (audio: HTMLAudioElement | null) => void,
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const parts = splitNovaVeraSpeech(text);
  const segments =
    parts.hasStructure && (parts.nova || parts.vera)
      ? [
          { text: parts.nova, voice: NOVA_TTS_VOICE },
          { text: parts.vera, voice: VERA_TTS_VOICE },
        ].filter((s) => s.text)
      : [{ text, voice: NOVA_TTS_VOICE }];

  const volume = loadVoicePrefs().outputVolume ?? 1;

  for (const segment of segments) {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: segment.text, voice: segment.voice, lang }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.volume = Math.min(1, Math.max(0, volume));
      onAudio?.(audio);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        onAudio?.(null);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        onAudio?.(null);
        resolve();
      };
      audio.play().catch(() => resolve());
    });
  }
  return true;
}

export function speakLocally(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = synth.getVoices();
  const locale = lang.slice(0, 2);
  const pick = (hint: RegExp) =>
    voices.find((v) => hint.test(v.name) || v.lang.startsWith(locale)) ?? voices[0];

  const primary = pick(/female|samantha|victoria|zira|coral|nova/i);
  const secondary = pick(/male|alex|daniel|sage|onyx/i);

  const parts = splitNovaVeraSpeech(text);
  const chunks =
    parts.hasStructure && (parts.nova || parts.vera)
      ? [
          parts.nova ? { persona: "nova" as const, text: parts.nova } : null,
          parts.vera ? { persona: "vera" as const, text: parts.vera } : null,
        ].filter(Boolean)
      : [{ persona: "nova" as const, text }];

  for (const chunk of chunks as Array<{ persona: "nova" | "vera"; text: string }>) {
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.voice = chunk.persona === "nova" ? (primary ?? null) : (secondary ?? primary ?? null);
    utterance.lang = locale === "uk" ? "uk-UA" : locale === "ru" ? "ru-RU" : locale;
    utterance.rate = chunk.persona === "nova" ? 0.98 : 0.92;
    utterance.pitch = chunk.persona === "nova" ? 1.02 : 0.94;
    synth.speak(utterance);
  }
}
