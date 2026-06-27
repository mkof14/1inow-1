import type { LangCode } from "@/lib/i18n/dictionaries";

export const SPEECH_LOCALES: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  uk: "uk-UA",
  es: "es-ES",
  de: "de-DE",
};

const SUPPORTED = new Set(["en", "ru", "uk", "es", "de"]);

export function toSpeechLocale(lang: string) {
  const code = lang.slice(0, 2).toLowerCase();
  return SPEECH_LOCALES[code] ?? SPEECH_LOCALES.en;
}

export function toSttLanguage(lang: string) {
  const code = lang.slice(0, 2).toLowerCase();
  return SUPPORTED.has(code) ? code : "en";
}

/** Guess spoken/written language from user text (no external API). */
export function detectLanguageFromText(text: string): LangCode | null {
  const sample = text.trim().slice(0, 400);
  if (!sample) return null;

  if (/[\u0400-\u04FF]/.test(sample)) {
    if (/[іїєґ]/i.test(sample)) return "uk";
    if (/[ыэёъ]/i.test(sample)) return "ru";
    // Cyrillic without uk markers — lean Russian if ы/э present else Ukrainian
    return /[ыэёъ]/i.test(sample) ? "ru" : "uk";
  }
  if (/[äöüß]/i.test(sample) || /\b(und|ich|nicht|bitte|danke)\b/i.test(sample)) return "de";
  if (/[ñáéíóúü¿¡]/i.test(sample) || /\b(hola|gracias|por favor|qué)\b/i.test(sample)) return "es";
  if (/[a-z]/i.test(sample)) return "en";
  return null;
}

/** Prefer the language the user actually spoke/wrote; fall back to UI language. */
export function resolveResponseLang(uiLang: string, userText?: string) {
  const detected = userText ? detectLanguageFromText(userText) : null;
  if (detected) return detected;
  const code = uiLang.slice(0, 2).toLowerCase();
  return SUPPORTED.has(code) ? code : "en";
}

export function languageLabel(code: string) {
  const labels: Record<string, string> = {
    en: "EN",
    ru: "RU",
    uk: "UA",
    es: "ES",
    de: "DE",
  };
  return labels[code.slice(0, 2).toLowerCase()] ?? code.slice(0, 2).toUpperCase();
}
