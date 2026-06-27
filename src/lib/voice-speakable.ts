/**
 * Extract one natural sentence for TTS — collapsed single-voice mode.
 */

import { splitNovaVeraSpeech } from "@/lib/sense-personas";
import { loadVoicePrefs } from "@/lib/voice-prefs";

export function toSpeakableText(raw: string, maxChars = 480): string {
  let text = raw.trim();
  if (!text) return "";

  text = text
    .replace(/^Nova:\s*/gim, "")
    .replace(/^Vera:\s*/gim, "")
    .replace(/^Next steps?:?\s*/gim, "")
    .replace(/^Дальше:?\s*/gim, "")
    .replace(/^Siguientes pasos:?\s*/gim, "")
    .replace(/^Nächste Schritte:?\s*/gim, "")
    .replace(/^-\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n");

  const blocks = text.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const conversational = blocks.find(
    (b) =>
      !/^nova:/i.test(b) &&
      !/^vera:/i.test(b) &&
      !/^next/i.test(b) &&
      !/^дальше/i.test(b) &&
      b.length > 12,
  );

  let spoken = conversational ?? blocks[0] ?? text;
  spoken = spoken.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").trim();

  const sentences = spoken.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [spoken];
  spoken = sentences.slice(0, 2).join(" ").trim();

  if (spoken.length > maxChars) {
    spoken = `${spoken.slice(0, maxChars - 1).trim()}…`;
  }

  return spoken;
}

/** Text for TTS — preserve Nova/Vera blocks when dual mode is on. */
export function resolveSpeechText(raw: string, opts?: { forceDual?: boolean }): string {
  const text = raw.trim();
  if (!text) return "";

  const dualOn = opts?.forceDual ?? loadVoicePrefs().dualPersonaTts !== false;
  if (dualOn && splitNovaVeraSpeech(text).hasStructure) return text;

  return toSpeakableText(text);
}

export function hasDualPersonaStructure(text: string) {
  return splitNovaVeraSpeech(text).hasStructure;
}
