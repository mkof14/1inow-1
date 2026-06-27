/**
 * Extract one natural sentence for TTS — no dual Nova/Vera readout.
 * Industry pattern: single assistant voice (ChatGPT Voice, Alexa, Siri).
 */

export function toSpeakableText(raw: string, maxChars = 480): string {
  let text = raw.trim();
  if (!text) return "";

  // Strip structured Sense format
  text = text
    .replace(/^Nova:\s*/gim, "")
    .replace(/^Vera:\s*/gim, "")
    .replace(/^Next steps?:?\s*/gim, "")
    .replace(/^Дальше:?\s*/gim, "")
    .replace(/^Siguientes pasos:?\s*/gim, "")
    .replace(/^Nächste Schritte:?\s*/gim, "")
    .replace(/^-\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n");

  // Prefer first paragraph (summary) before Nova/Vera blocks
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

  // One or two sentences max for voice
  const sentences = spoken.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [spoken];
  spoken = sentences.slice(0, 2).join(" ").trim();

  if (spoken.length > maxChars) {
    spoken = `${spoken.slice(0, maxChars - 1).trim()}…`;
  }

  return spoken;
}
