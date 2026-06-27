/** Intelligence self-learning loop — memory, questions, voice ↔ UI bridge. */

import { supabase } from "@/integrations/supabase/client";

export type IntelligenceTab =
  | "memory"
  | "questions"
  | "reminders"
  | "rules"
  | "audit"
  | "prefs";

export function focusIntelligenceTab(tab: IntelligenceTab) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("1inow:intelligence-focus", { detail: { tab } }));
}

export async function fetchLearningStats(userId?: string) {
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return { memories: 0, openQuestions: 0, pendingReminders: 0 };

  const [memories, questions, reminders] = await Promise.all([
    supabase
      .from("ai_memories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "active"),
    supabase
      .from("ai_questions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "open"),
    supabase
      .from("ai_reminders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "pending"),
  ]);

  return {
    memories: memories.count ?? 0,
    openQuestions: questions.count ?? 0,
    pendingReminders: reminders.count ?? 0,
  };
}

export function learningStatsMessage(
  stats: { memories: number; openQuestions: number; pendingReminders: number },
  lang = "en",
) {
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  if (ru) {
    return `Память: ${stats.memories}. Открытых вопросов: ${stats.openQuestions}. Напоминаний: ${stats.pendingReminders}.`;
  }
  if (es) {
    return `Memoria: ${stats.memories}. Preguntas abiertas: ${stats.openQuestions}. Recordatorios: ${stats.pendingReminders}.`;
  }
  if (de) {
    return `Gedächtnis: ${stats.memories}. Offene Fragen: ${stats.openQuestions}. Erinnerungen: ${stats.pendingReminders}.`;
  }
  return `Memory: ${stats.memories}. Open questions: ${stats.openQuestions}. Reminders: ${stats.pendingReminders}.`;
}

export function isShowMemoriesPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|open|list|what|my|покажи|открой|список|відкрий|мої|mostrar|mis|zeige|meine)\s+(?:my\s+)?(?:memor(?:y|ies)|памят|пам'ят|память|спогад|memoria|gedächtnis)/.test(
      lower,
    ) ||
    /^(?:what do you remember|что ты запомнила|що ти запам'ятала|qué recuerdas|was merkst du)/.test(
      lower,
    )
  );
}

export function isShowLearningQuestionsPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|open|list|покажи|открой|відкрий|mostrar|zeige)\s+(?:open\s+)?(?:questions|learning|вопросы|питання|preguntas|fragen)/.test(
      lower,
    ) ||
    /^(?:open questions|открытые вопросы|відкриті питання|preguntas abiertas|offene fragen)$/.test(
      lower,
    )
  );
}

export function isLearningSummaryPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return /^(?:learning summary|статус обучения|статус навчання|resumen de aprendizaje|lernübersicht)/.test(
    lower,
  );
}

const MEMORY_ENABLED_KEY = "1inow:assistant:memory-enabled";

export function setAssistantMemoryEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MEMORY_ENABLED_KEY, enabled ? "1" : "0");
  } catch {}
}

export function isAssistantMemoryEnabled() {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.sessionStorage.getItem(MEMORY_ENABLED_KEY);
    return raw !== "0";
  } catch {
    return true;
  }
}
