import { logWorkspaceActivity } from "@/lib/activity-log";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MemoryType = Database["public"]["Enums"]["ai_memory_type"];

const TEACH_PATTERNS: Array<{ re: RegExp; type: MemoryType }> = [
  {
    re: /^(?:remember(?:\s+that)?|always|never|prefer)\s*[-:]?\s*(.+)$/i,
    type: "user_preference",
  },
  { re: /^(?:запомни|запомнить|всегда|никогда)\s*[-:]?\s*(.+)$/i, type: "user_preference" },
  { re: /^(?:запам'ятай|запамятай|завжди|ніколи)\s*[-:]?\s*(.+)$/i, type: "user_preference" },
  { re: /^(?:recuerda|recuerde|siempre|nunca)\s*[-:]?\s*(.+)$/i, type: "user_preference" },
  { re: /^(?:merke dir|merken|immer|nie)\s*[-:]?\s*(.+)$/i, type: "user_preference" },
  { re: /^(?:correct(?:ion)?|actually)\s*[-:]?\s*(.+)$/i, type: "correction" },
  { re: /^(?:исправь|на самом деле)\s*[-:]?\s*(.+)$/i, type: "correction" },
  { re: /^(?:виправ|насправді)\s*[-:]?\s*(.+)$/i, type: "correction" },
];

export function extractMemoryTeach(prompt: string) {
  const text = prompt.trim();
  if (!text) return null;

  for (const { re, type } of TEACH_PATTERNS) {
    const match = text.match(re);
    if (!match?.[1]) continue;
    const value = match[1].trim();
    if (value.length < 3) continue;
    const key = slugKey(value);
    return { key, value, type };
  }
  return null;
}

export async function saveMemoryTeach(input: {
  userId: string;
  key: string;
  value: string;
  type: MemoryType;
  lang?: string;
}) {
  const { data: existing } = await supabase
    .from("ai_memories")
    .select("id")
    .eq("user_id", input.userId)
    .eq("key", input.key)
    .eq("status", "active")
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("ai_memories")
      .update({ value: input.value, type: input.type, confidence: "high" })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("ai_memories").insert({
      user_id: input.userId,
      key: input.key,
      value: input.value,
      type: input.type,
      confidence: "high",
      status: "active",
      zone: "business",
    });
    if (error) throw error;
  }

  await logWorkspaceActivity({
    userId: input.userId,
    action: "memory.taught",
    entityType: "ai_memory",
    metadata: { key: input.key, type: input.type },
  }).catch(() => undefined);

  const ru = input.lang?.startsWith("ru") || input.lang?.startsWith("uk");
  return ru
    ? `Запомнила.\n\nNova: Сохранила «${input.key}» в память.\nVera: Буду учитывать это в следующих ответах.\n\nNext steps:\n- Спроси снова, если нужно проверить\n- Открой Intelligence → Memory для правок`
    : `Got it — saved to memory.\n\nNova: Stored “${input.key}” for faster future answers.\nVera: I'll apply this in upcoming guidance.\n\nNext steps:\n- Ask again to verify\n- Edit in Intelligence → Memory if needed`;
}

/** Store a Q&A snippet for long-term recall (deduped by question key). */
export async function saveConversationMemory(input: {
  userId: string;
  question: string;
  answer: string;
  lang?: string;
}) {
  const question = input.question.trim();
  const answer = input.answer.trim();
  if (question.length < 8 || answer.length < 12) return;

  const key = `qa_${slugKey(question)}`.slice(0, 48);
  const value = `Q: ${question.slice(0, 280)}\nA: ${answer.slice(0, 400)}`;

  const { data: existing } = await supabase
    .from("ai_memories")
    .select("id")
    .eq("user_id", input.userId)
    .eq("key", key)
    .eq("status", "active")
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("ai_memories")
      .update({ value, confidence: "medium" })
      .eq("id", existing.id);
  } else {
    await supabase.from("ai_memories").insert({
      user_id: input.userId,
      key,
      value,
      type: "pattern",
      confidence: "medium",
      status: "active",
      zone: "business",
      source_text: question.slice(0, 500),
    });
  }
}

function slugKey(value: string) {
  const base =
    value
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join("_") || "memory";
  return base.slice(0, 48);
}
