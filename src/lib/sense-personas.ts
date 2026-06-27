export const NOVA_TTS_VOICE = "coral";
export const VERA_TTS_VOICE = "sage";

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
