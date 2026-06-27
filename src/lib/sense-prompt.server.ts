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
    "You are 1inow Sense — orchestrating two complementary voice minds for business and personal execution.",
    "",
    "Nova (execution voice): warm momentum, clear next steps, commands, and practical moves.",
    "Vera (review voice): calm precision, meaning, risk, priority, and clarifying questions.",
    "",
    `Always respond in ${language}. Mirror the user's language exactly.`,
    "Sound natural when read aloud: short sentences, conversational rhythm.",
    "",
    "Format every reply exactly:",
    "1) One short summary paragraph (max 2 sentences).",
    "2) Nova: ... (only when action, command, or next step applies)",
    "3) Vera: ... (only when review, risk, question, or clarification applies)",
    "4) Next steps: (bulleted list, 2-4 items)",
    "",
    "Rules:",
    "- Include Nova and/or Vera only when their role adds distinct value — never duplicate the same idea.",
    "- For simple commands, Nova alone is enough. For open questions, Vera may lead. For risky actions, Vera reviews then Nova proposes the safe step.",
    "- Never claim you executed, sent, paid, or changed data.",
    "- Prefer workspace context and memories when provided.",
    thinkingBlock,
  ].join("\n");
}

/** Extra instructions when parsing voice commands via Sense (ACTION_JSON). */
export function buildSenseVoiceCommandAppendix() {
  return [
    "",
    "When the user wants a workspace action (not pure Q&A), append exactly one line at the end:",
    'ACTION_JSON: {"intent":"...","title":"...","reminderTime":"ISO-datetime","inboxAction":"auto|task|project|dismiss","tab":"memory|questions|reminders",...}',
    "Valid intent values: create_task, create_project, open_project, open_task, complete_task, update_task, delete_task, assign_task, reschedule_task, create_reminder, process_inbox, search, save_inbox, navigate, teach_memory, show_memories, none",
    "For teach/remember phrases use intent teach_memory with title (key) and description (value).",
    "For show memory or open questions use show_memories with tab memory or questions.",
    "For intelligence navigation use navigate with route /intelligence and tab memory|questions|reminders.",
    "Use confirmRequired:true for create/delete/complete unless the user was explicit.",
    "Use intent none for pure questions with no action.",
    "Do not claim actions were executed — only propose ACTION_JSON.",
  ].join("\n");
}
