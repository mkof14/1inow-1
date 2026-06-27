import { resolveTtsVoices } from "@/lib/sense-personas";

/** Premade ElevenLabs voices tuned for warm Nova / calm Vera personas. */
const ELEVENLABS_PROFILES: Record<string, { nova: string; vera: string }> = {
  en: {
    nova: "XB0fDUnXU5powFXDhCwa", // Charlotte — warm, multilingual
    vera: "JBFqnCBsd6RMkjVDRZzb", // George — calm, clear
  },
  ru: {
    nova: "XrExE9yKIg1WjnnlVkGX", // Matilda — expressive female
    vera: "ErXwobaYiN019PkySvjV", // Antoni — steady male
  },
  uk: {
    nova: "21m00Tcm4TlvDq8ikWAM", // Rachel — natural female
    vera: "N2lVS1w4EtoT3dr4eOWO", // Callum — measured male
  },
  es: {
    nova: "EXAVITQu4vr4xnSDxMaL", // Bella — bright female
    vera: "TxGEqnHWrfWFTfGW9XjX", // Josh — warm male
  },
  de: {
    nova: "MF3mGyEYCl7XYWbV9V6O", // Elli — clear female
    vera: "pNInz6obpgDQGcFmaJgB", // Adam — professional male
  },
};

const ELEVENLABS_VOICE_ID = /^[A-Za-z0-9]{16,24}$/;

export const ELEVENLABS_VOICE_OPTIONS = [
  { id: "XB0fDUnXU5powFXDhCwa", label: "Charlotte — warm (Nova default EN)" },
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George — calm (Vera default EN)" },
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda — expressive (Nova RU)" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni — steady (Vera RU)" },
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel — natural female" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella — bright female" },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh — warm male" },
  { id: "MF3mGyEYCl7XYWbV9V6O", label: "Elli — clear female" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam — professional male" },
] as const;

export function resolveElevenLabsVoices(lang: string) {
  const code = lang.slice(0, 2).toLowerCase();
  const profile = ELEVENLABS_PROFILES[code] ?? ELEVENLABS_PROFILES.en;
  const novaOverride = process.env.ELEVENLABS_VOICE_NOVA?.trim();
  const veraOverride = process.env.ELEVENLABS_VOICE_VERA?.trim();
  return {
    nova: novaOverride || profile.nova,
    vera: veraOverride || profile.vera,
  };
}

/** Map OpenAI voice names from the client to ElevenLabs voice ids. */
export function resolveElevenLabsVoiceId(lang: string, requestedVoice?: string | null) {
  const voices = resolveElevenLabsVoices(lang);
  const trimmed = requestedVoice?.trim();
  if (trimmed && ELEVENLABS_VOICE_ID.test(trimmed)) return trimmed;

  const openai = resolveTtsVoices(lang);
  if (trimmed === openai.vera) return voices.vera;
  if (trimmed === openai.nova) return voices.nova;

  const allOpenAiVera = new Set(
    Object.keys(ELEVENLABS_PROFILES).map((code) => resolveTtsVoices(code).vera),
  );
  if (trimmed && allOpenAiVera.has(trimmed)) return voices.vera;

  return voices.nova;
}
