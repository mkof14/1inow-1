export const NOVA_TTS_VOICE = "coral";
export const VERA_TTS_VOICE = "sage";

/** Per-locale OpenAI voice pairs (natural, warm; text language drives pronunciation). */
const TTS_PROFILES: Record<string, { nova: string; vera: string }> = {
  en: { nova: "coral", vera: "sage" },
  ru: { nova: "shimmer", vera: "onyx" },
  uk: { nova: "shimmer", vera: "sage" },
  es: { nova: "nova", vera: "shimmer" },
  de: { nova: "alloy", vera: "fable" },
};

export function resolveTtsVoices(lang: string) {
  const code = lang.slice(0, 2).toLowerCase();
  return TTS_PROFILES[code] ?? TTS_PROFILES.en;
}

/** Single Sense voice for daily voice UX (ChatGPT Voice / Alexa pattern). */
export function resolveSenseVoice(lang: string): string {
  const override = process.env.SENSE_TTS_VOICE?.trim() || process.env.ELEVENLABS_VOICE_SENSE?.trim();
  if (override) return override;
  return resolveTtsVoices(lang).nova;
}

export const SENSE_PERSONA_LABELS = {
  nova: "Nova",
  vera: "Vera",
} as const;

/** Split assistant text into Nova/Vera sections for dual-voice playback. */
export function splitNovaVeraSpeech(text: string) {
  const novaMatch = text.match(/Nova:\s*([\s\S]*?)(?=Vera:|Next steps:|$)/i);
  const veraMatch = text.match(/Vera:\s*([\s\S]*?)(?=Next steps:|$)/i);
  return {
    nova: novaMatch?.[1]?.trim() ?? "",
    vera: veraMatch?.[1]?.trim() ?? "",
    hasStructure: Boolean(novaMatch || veraMatch),
  };
}
