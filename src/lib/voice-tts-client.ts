import { supabase } from "@/integrations/supabase/client";
import { resolveTtsVoices, splitNovaVeraSpeech } from "@/lib/sense-personas";
import { loadVoicePrefs } from "@/lib/voice-prefs";
import { toSpeechLocale } from "@/lib/voice-locale";

const LOCAL_VOICE_HINTS: Record<string, { nova: RegExp[]; vera: RegExp[]; lang: string }> = {
  ru: {
    lang: "ru-RU",
    nova: [/milena|google русский|ru-ru.*female|yandex.*female/i],
    vera: [/yuri|dmitri|google русский.*male|ru-ru.*male/i],
  },
  uk: {
    lang: "uk-UA",
    nova: [/lesya|uk-ua|ukrainian.*female/i],
    vera: [/uk-ua.*male|ukrainian.*male/i],
  },
  es: {
    lang: "es-ES",
    nova: [/monica|paulina|google español|es-es.*female|spanish.*female/i],
    vera: [/diego|jorge|google español.*male|es-es.*male/i],
  },
  de: {
    lang: "de-DE",
    nova: [/anna|petra|google deutsch|de-de.*female|german.*female/i],
    vera: [/markus|stefan|google deutsch.*male|de-de.*male/i],
  },
  en: {
    lang: "en-US",
    nova: [/samantha|zira|google us english|karen|female.*en/i],
    vera: [/daniel|alex|google uk english male|tom/i],
  },
};

async function waitForVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length) return voices;
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.onvoiceschanged = done;
    setTimeout(done, 400);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], hints: RegExp[], lang: string) {
  return (
    hints.map((h) => voices.find((v) => h.test(v.name) || h.test(v.lang))).find(Boolean) ??
    voices.find((v) => v.lang.startsWith(lang.slice(0, 2))) ??
    voices[0]
  );
}

export async function playServerTts(
  text: string,
  lang: string,
  onAudio?: (audio: HTMLAudioElement | null) => void,
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const voices = resolveTtsVoices(lang);
  const parts = splitNovaVeraSpeech(text);
  const segments =
    parts.hasStructure && (parts.nova || parts.vera)
      ? [
          { text: parts.nova, voice: voices.nova },
          { text: parts.vera, voice: voices.vera },
        ].filter((s) => s.text)
      : [{ text, voice: voices.nova }];

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

export async function speakLocally(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const code = lang.slice(0, 2).toLowerCase();
  const hints = LOCAL_VOICE_HINTS[code] ?? LOCAL_VOICE_HINTS.en;
  const voices = await waitForVoices();
  const primary = pickVoice(voices, hints.nova, hints.lang);
  const secondary =
    pickVoice(
      voices.filter((v) => v.name !== primary?.name),
      hints.vera,
      hints.lang,
    ) ?? primary;

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
    utterance.lang = toSpeechLocale(lang);
    utterance.rate = chunk.persona === "nova" ? 0.96 : 0.9;
    utterance.pitch = chunk.persona === "nova" ? 1.0 : 0.95;
    synth.speak(utterance);
  }
}

export async function speakNovaVeraText(
  text: string,
  lang: string,
  onAudio?: (audio: HTMLAudioElement | null) => void,
): Promise<boolean> {
  const ok = await playServerTts(text, lang, onAudio);
  if (!ok) await speakLocally(text, lang);
  return true;
}
