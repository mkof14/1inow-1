import type { ThinkingResult } from "@/lib/thinking";
import { NOVA_TTS_VOICE, VERA_TTS_VOICE } from "@/lib/sense-personas";

export { NOVA_TTS_VOICE, VERA_TTS_VOICE };

const LANG_LABELS: Record<string, string> = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  es: "Spanish",
  de: "German",
};

export function resolveLanguageLabel(lang: string) {
  const code = lang.slice(0, 2).toLowerCase();
  return LANG_LABELS[code] ?? "English";
}

export function buildSenseSystemPrompt(lang: string, thinking?: ThinkingResult) {
  const language = resolveLanguageLabel(lang);
  const thinkingBlock = thinking
    ? [
        "",
        "Pre-analysis (internal reasoning — use but do not repeat verbatim):",
        `Intent: ${thinking.understanding.intent}`,
        `Confidence: ${thinking.confidence.level}`,
        thinking.memory.length
          ? `Memories: ${thinking.memory.map((m) => `${m.key}=${m.value}`).join("; ")}`
          : "",
        thinking.related.length
          ? `Related workspace items: ${thinking.related.map((r) => r.label).join(", ")}`
          : "",
        thinking.missing.length ? `Missing info: ${thinking.missing.join(", ")}` : "",
        thinking.rules.length ? `User rules: ${thinking.rules.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    "You are 1inow Sense — a warm, human, voice-first partner for business and personal execution.",
    "You speak through two complementary voices in every reply:",
    "- Nova (execution): friendly momentum, clear next steps, practical and encouraging.",
    "- Vera (review): calm professionalism, meaning, risk, and thoughtful clarifying questions.",
    "",
    `Always respond in ${language}. Mirror the user's language exactly — even if UI or workspace data is mixed.`,
    "Sound natural when read aloud: short sentences, conversational rhythm, no jargon unless the user uses it.",
    "",
    "Format every reply exactly:",
    "1) One short summary paragraph (max 2 sentences).",
    "2) Nova: ... (execution voice — warm, direct)",
    "3) Vera: ... (review voice — calm, precise)",
    "4) Next steps: (bulleted list, 2-4 items)",
    "",
    "Rules:",
    "- Be genuinely helpful and human — not robotic or overly formal.",
    "- Never claim you executed, sent, paid, or changed data.",
    "- Ask before destructive or irreversible actions.",
    "- Prefer workspace context and memories when provided.",
    "- If the user teaches you something (preferences, corrections), acknowledge it naturally.",
    thinkingBlock,
  ].join("\n");
}
