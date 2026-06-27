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

/** Split long TTS into sentence chunks for prefetch streaming. */
export function splitTtsChunks(text: string, maxLen = 160): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxLen) return [trimmed];

  const sentences = trimmed.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [trimmed];
  const chunks: string[] = [];
  let buf = "";
  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;
    const candidate = buf ? `${buf} ${piece}` : piece;
    if (buf && candidate.length > maxLen) {
      chunks.push(buf);
      buf = piece;
    } else {
      buf = candidate;
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [trimmed];
}

async function fetchTtsBlob(text: string, lang: string, voiceId: string) {
  const headers = await buildTtsHeaders();
  const res = await fetch("/api/tts", {
    method: "POST",
    headers,
    body: JSON.stringify({ text, voice: voiceId, lang }),
  });
  if (!res.ok) return null;
  return res.blob();
}

async function playTtsBlob(
  blob: Blob,
  volume: number,
  onAudio?: (audio: HTMLAudioElement | null) => void,
  isAborted?: () => boolean,
) {
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
    if (isAborted) {
      poll = setInterval(() => {
        if (isAborted()) {
          try {
            audio.pause();
          } catch {}
          finish();
        }
      }, 80);
    }
  });
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
  const voices = resolveTtsVoices(lang);
  const voice = options?.voiceId ?? resolveSenseVoice(lang);
  const volume = loadVoicePrefs().outputVolume ?? 1;
  const streaming = loadVoicePrefs().streamingTts !== false;
  const chunks = streaming ? splitTtsChunks(text) : [text];

  if (streaming && chunks.length > 1) {
    let nextFetch: Promise<Blob | null> = fetchTtsBlob(chunks[0]!, lang, voice);
    for (let i = 0; i < chunks.length; i++) {
      if (options?.isAborted?.()) break;
      const blob = await nextFetch;
      if (!blob) {
        console.warn("[tts] streaming chunk failed", i);
        return false;
      }
      if (i + 1 < chunks.length) {
        nextFetch = fetchTtsBlob(chunks[i + 1]!, lang, voice);
      }
      await playTtsBlob(blob, volume, onAudio, options?.isAborted);
    }
    return true;
  }

  const headers = await buildTtsHeaders();
  const segments = [{ text, voice }];

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
    await playTtsBlob(blob, volume, onAudio, options?.isAborted);

    if (segments.length > 1 && !options?.singleVoice) await sleep(NOVA_VERA_PAUSE_MS);
  }
  return true;
}

export async function speakLocally(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const split = splitNovaVeraSpeech(text);
  const code = lang.slice(0, 2).toLowerCase();
  const hints = LOCAL_VOICE_HINTS[code] ?? LOCAL_VOICE_HINTS.en;
  const voices = await waitForVoices();
  const novaVoice = pickVoice(voices, hints.nova, hints.lang);
  const veraVoice = pickVoice(voices, hints.vera, hints.lang);

  const segments: { line: string; voice: SpeechSynthesisVoice | null }[] = [];
  if (split.hasStructure) {
    if (split.nova.trim()) segments.push({ line: toSpeakableText(split.nova, 900), voice: novaVoice ?? null });
    if (split.vera.trim()) segments.push({ line: toSpeakableText(split.vera, 900), voice: veraVoice ?? null });
  } else {
    const spoken = toSpeakableText(text);
    if (spoken) segments.push({ line: spoken, voice: novaVoice ?? null });
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (!seg.line) continue;
    const utterance = new SpeechSynthesisUtterance(seg.line);
    utterance.voice = seg.voice;
    utterance.lang = toSpeechLocale(lang);
    utterance.rate = 0.96;
    utterance.pitch = seg.voice === veraVoice ? 0.95 : 1.0;
    await speakUtterance(synth, utterance);
    if (i < segments.length - 1) await sleep(NOVA_VERA_PAUSE_MS);
  }
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
  } else if (loadVoicePrefs().dualPersonaTts !== false && text.length > 120) {
    const spoken = toSpeakableText(text, 900);
    if (spoken) {
      const mid = Math.floor(spoken.length / 2);
      const breakAt = spoken.indexOf(". ", mid);
      if (breakAt > 40 && breakAt < spoken.length - 20) {
        segments.push({ persona: "nova", line: spoken.slice(0, breakAt + 1).trim(), voiceId: voices.nova });
        segments.push({ persona: "vera", line: spoken.slice(breakAt + 1).trim(), voiceId: voices.vera });
      } else {
        segments.push({ persona: "nova", line: spoken, voiceId: voices.nova });
      }
    }
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
