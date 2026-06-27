import { supabase } from "@/integrations/supabase/client";
import { isFounderModeEnabled } from "@/lib/founder-mode";
import { resolveSenseVoice, resolveTtsVoices, splitNovaVeraSpeech } from "@/lib/sense-personas";
import { toSpeakableText } from "@/lib/voice-speakable";
import type { VoicePersona } from "@/lib/voice-persona";
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

const NOVA_VERA_PAUSE_MS = 420;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function speakUtterance(synth: SpeechSynthesis, utterance: SpeechSynthesisUtterance) {
  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

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

async function buildTtsHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (isFounderModeEnabled()) {
    headers["X-1inow-Founder-Voice"] = "1";
  }
  return headers;
}

export async function playServerTts(
  text: string,
  lang: string,
  onAudio?: (audio: HTMLAudioElement | null) => void,
  options?: { singleVoice?: boolean; voiceId?: string; isAborted?: () => boolean },
) {
  const headers = await buildTtsHeaders();

  const voices = resolveTtsVoices(lang);
  const voice = options?.voiceId ?? resolveSenseVoice(lang);
  const segments = [{ text, voice }];

  const volume = loadVoicePrefs().outputVolume ?? 1;

  for (const segment of segments) {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: segment.text, voice: segment.voice, lang }),
    });
    if (!res.ok) {
      console.warn("[tts] ElevenLabs/server synthesis unavailable", res.status, await res.text());
      return false;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.volume = Math.min(1, Math.max(0, volume));
      onAudio?.(audio);
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (poll) clearInterval(poll);
        URL.revokeObjectURL(url);
        onAudio?.(null);
        resolve();
      };
      audio.onended = finish;
      audio.onerror = finish;
      void audio.play().catch(finish);
      let poll: ReturnType<typeof setInterval> | undefined;
      if (options?.isAborted) {
        poll = setInterval(() => {
          if (options.isAborted?.()) {
            try {
              audio.pause();
            } catch {}
            finish();
          }
        }, 80);
      }
    });

    if (segments.length > 1 && !options?.singleVoice) await sleep(NOVA_VERA_PAUSE_MS);
  }
  return true;
}

export async function speakLocally(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const spoken = toSpeakableText(text);
  if (!spoken) return;
  const code = lang.slice(0, 2).toLowerCase();
  const hints = LOCAL_VOICE_HINTS[code] ?? LOCAL_VOICE_HINTS.en;
  const voices = await waitForVoices();
  const primary = pickVoice(voices, hints.nova, hints.lang);

  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.voice = primary ?? null;
  utterance.lang = toSpeechLocale(lang);
  utterance.rate = 0.96;
  utterance.pitch = 1.0;
  await speakUtterance(synth, utterance);
}

export async function speakAssistantText(
  text: string,
  lang: string,
  onAudio?: (audio: HTMLAudioElement | null) => void,
  onPersona?: (persona: VoicePersona | null) => void,
): Promise<boolean> {
  return speakPersonaText(text, lang, onAudio, onPersona);
}

/** Speak Nova/Vera blocks with distinct voices when structured; otherwise lead voice only. */
export async function speakPersonaText(
  text: string,
  lang: string,
  onAudio?: (audio: HTMLAudioElement | null) => void,
  onPersona?: (persona: VoicePersona | null) => void,
  isAborted?: () => boolean,
): Promise<boolean> {
  const split = splitNovaVeraSpeech(text);
  const voices = resolveTtsVoices(lang);
  const segments: { persona: VoicePersona; line: string; voiceId: string }[] = [];

  if (split.hasStructure) {
    if (split.nova.trim()) segments.push({ persona: "nova", line: split.nova.trim(), voiceId: voices.nova });
    if (split.vera.trim()) segments.push({ persona: "vera", line: split.vera.trim(), voiceId: voices.vera });
  } else {
    const spoken = toSpeakableText(text);
    if (!spoken) return false;
    segments.push({ persona: "nova", line: spoken, voiceId: voices.nova });
  }

  let ok = true;
  for (let i = 0; i < segments.length; i++) {
    if (isAborted?.()) break;
    const seg = segments[i]!;
    onPersona?.(seg.persona);
    const played = await playServerTts(seg.line, lang, onAudio, {
      voiceId: seg.voiceId,
      isAborted,
    });
    if (!played) ok = false;
    if (i < segments.length - 1) await sleep(NOVA_VERA_PAUSE_MS);
  }
  onPersona?.(null);

  if (!ok) {
    const fallback = toSpeakableText(text);
    if (fallback) await speakLocally(fallback, lang);
  }
  return ok;
}

/** @deprecated Use speakPersonaText */
export async function speakNovaVeraText(
  text: string,
  lang: string,
  onAudio?: (audio: HTMLAudioElement | null) => void,
): Promise<boolean> {
  return speakPersonaText(text, lang, onAudio);
}
