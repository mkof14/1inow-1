import { supabase } from "@/integrations/supabase/client";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:«»"'`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(query: string, candidate: string) {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (c === q) return 100;
  if (c.includes(q) || q.includes(c)) return 80;
  const qWords = q.split(" ").filter(Boolean);
  const hits = qWords.filter((w) => c.includes(w)).length;
  return (hits / Math.max(qWords.length, 1)) * 60;
}

export async function fetchPendingDecisions(limit = 20) {
  const { data, error } = await supabase
    .from("decisions")
    .select("id,title,status,impact,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function resolvePendingDecision(query?: string | null) {
  const pending = await fetchPendingDecisions();
  if (!pending.length) return null;

  const q = query?.trim();
  if (!q) return pending[0]!;

  let best = pending[0]!;
  let bestScore = 0;
  for (const decision of pending) {
    const s = scoreMatch(q, decision.title);
    if (s > bestScore) {
      bestScore = s;
      best = decision;
    }
  }
  return bestScore >= 35 ? best : pending[0]!;
}

export function parseDecisionVoiceIntent(
  raw: string,
  locale: "en" | "ru" | "uk" | "es" | "de",
): { intent: "approve_decision" | "reject_decision"; title?: string } | null {
  const text = raw.trim();
  const lower = normalize(text);

  const approveRes = [
    /^(?:approve|accept|confirm)\s+(?:decision|request|approval)?\s*(.*)$/i,
    /^(?:одобри|прими|утверди)\s+(?:решение|заявку|запрос)?\s*(.*)$/i,
    /^(?:затверди|погодити)\s+(?:рішення|запит)?\s*(.*)$/i,
    /^(?:aprobar|aceptar)\s+(?:decisi[oó]n|solicitud)?\s*(.*)$/i,
    /^(?:genehmigen|akzeptieren)\s+(?:entscheidung|anfrage)?\s*(.*)$/i,
  ];
  const rejectRes = [
    /^(?:reject|decline|deny)\s+(?:decision|request|approval)?\s*(.*)$/i,
    /^(?:отклони|отвергни|отмени)\s+(?:решение|заявку|запрос)?\s*(.*)$/i,
    /^(?:відхили|скасуй)\s+(?:рішення|запит)?\s*(.*)$/i,
    /^(?:rechazar|denegar)\s+(?:decisi[oó]n|solicitud)?\s*(.*)$/i,
    /^(?:ablehnen|zurückweisen)\s+(?:entscheidung|anfrage)?\s*(.*)$/i,
  ];

  for (const re of approveRes) {
    const m = text.match(re);
    if (m) {
      const tail = m[1]?.trim();
      return { intent: "approve_decision", title: tail || undefined };
    }
  }
  for (const re of rejectRes) {
    const m = text.match(re);
    if (m) {
      const tail = m[1]?.trim();
      return { intent: "reject_decision", title: tail || undefined };
    }
  }

  if (locale === "ru" || locale === "uk") {
    if (/^одобри$|^прими$|^утверди$/.test(lower)) return { intent: "approve_decision" };
    if (/^отклони$|^отвергни$/.test(lower)) return { intent: "reject_decision" };
  } else if (/^approve$|^accept$/.test(lower)) {
    return { intent: "approve_decision" };
  } else if (/^reject$|^decline$/.test(lower)) {
    return { intent: "reject_decision" };
  }

  return null;
}
