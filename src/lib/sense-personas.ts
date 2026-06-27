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
  const normalized = text.replace(/\*\*(Nova|Vera|Нова|Вера)\*\*:?\s*/gi, (_, name) => {
    const n = name.toLowerCase();
    if (n === "nova" || n === "нова") return "Nova: ";
    return "Vera: ";
  });

  const novaMatch = normalized.match(
    /(?:^|\n)(?:Nova|Нова|NOVA):\s*([\s\S]*?)(?=(?:^|\n)(?:Vera|Вера|VERA):|(?:^|\n)Next steps:|(?:^|\n)Дальше:|$)/im,
  );
  const veraMatch = normalized.match(
    /(?:^|\n)(?:Vera|Вера|VERA):\s*([\s\S]*?)(?=(?:^|\n)Next steps:|(?:^|\n)Дальше:|(?:^|\n)Siguientes|$)/im,
  );

  const nova = novaMatch?.[1]?.trim() ?? "";
  const vera = veraMatch?.[1]?.trim() ?? "";

  return {
    nova,
    vera,
    hasStructure: Boolean(nova || vera),
  };
}
