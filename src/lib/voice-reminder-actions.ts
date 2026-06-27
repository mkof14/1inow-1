import { supabase } from "@/integrations/supabase/client";
import { formatReminderTime } from "@/lib/voice-reminder-time";

export type UpcomingReminder = {
  id: string;
  title: string;
  reminderTime: string;
};

export async function fetchUpcomingReminders(limit = 5): Promise<UpcomingReminder[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ai_reminders")
    .select("id, title, reminder_time")
    .eq("user_id", auth.user.id)
    .eq("status", "pending")
    .gte("reminder_time", now)
    .order("reminder_time", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    reminderTime: row.reminder_time,
  }));
}

export async function fetchPendingReminderCount() {
  const items = await fetchUpcomingReminders(100);
  return items.length;
}

export function reminderListMessage(items: UpcomingReminder[], lang = "en") {
  const ru = lang.startsWith("ru");
  const uk = lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  if (items.length === 0) {
    return uk
      ? "Немає запланованих нагадувань."
      : ru
        ? "Нет запланированных напоминаний."
        : es
          ? "No hay recordatorios programados."
          : de
            ? "Keine geplanten Erinnerungen."
            : "No upcoming reminders.";
  }
  const sample = items[0]!;
  const when = formatReminderTime(sample.reminderTime, lang);
  const head = uk
    ? `Нагадувань: ${items.length}. Найближче: «${sample.title}» · ${when}`
    : ru
      ? `Напоминаний: ${items.length}. Ближайшее: «${sample.title}» · ${when}`
      : es
        ? `${items.length} recordatorio${items.length === 1 ? "" : "s"}. Próximo: «${sample.title}» · ${when}`
        : de
          ? `${items.length} Erinnerung${items.length === 1 ? "" : "en"}. Nächste: «${sample.title}» · ${when}`
          : `${items.length} reminder${items.length === 1 ? "" : "s"}. Next: ${sample.title} · ${when}`;
  return head;
}

export function isShowRemindersPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|list|open|what|my|покажи|список|відкрий|мої|mostrar|mis|zeige|meine)\s+(?:my\s+)?(?:reminder|reminders|напоминан|нагадуван|recordatorio|erinnerung)/.test(
      lower,
    ) ||
    /^(?:upcoming reminders|ближайшие напоминания|найближчі нагадування|próximos recordatorios|nächste erinnerungen)$/.test(
      lower,
    )
  );
}

export function isReminderCountQuestion(raw: string) {
  const lower = raw.toLowerCase().trim();
  return /^(?:how many reminder|сколько напоминан|скільки нагадуван|cuántos recordatorio|wie viele erinnerung)/.test(
    lower,
  );
}

export async function fetchFirstUpcomingReminder(
  title?: string,
  options?: { exactOnly?: boolean },
): Promise<UpcomingReminder | null> {
  const items = await fetchUpcomingReminders(25);
  if (!title?.trim()) return items[0] ?? null;
  const needle = title.toLowerCase().trim();
  const exact =
    items.find((item) => item.title.toLowerCase() === needle) ??
    items.find((item) => item.title.toLowerCase().replace(/[«»"'`]+/g, "") === needle.replace(/[«»"'`]+/g, ""));
  if (exact) return exact;
  if (options?.exactOnly) return null;
  return (
    items.find((item) => item.title.toLowerCase().includes(needle)) ??
    items.find((item) => needle.includes(item.title.toLowerCase())) ??
    null
  );
}

export async function cancelUpcomingReminder(title?: string, options?: { exactOnly?: boolean }) {
  const hit = await fetchFirstUpcomingReminder(title, options);
  if (!hit) return null;
  const { cancelReminderRecord } = await import("@/lib/voice-reminder-engine");
  await cancelReminderRecord(hit.id, "canceled");
  return hit;
}

export function isCancelReminderPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:cancel|delete|remove|remove|отмени|удали|скасуй|borrar|cancelar|lösch|entfern)\s+(?:the\s+)?(?:first\s+)?(?:reminder|напоминан|нагадуван|recordatorio|erinnerung)/.test(
      lower,
    ) ||
    /^(?:cancel|отмени|скасуй)\s+напоминание/.test(lower)
  );
}

export function extractCancelReminderTitle(raw: string) {
  const quoted = raw.trim().match(/[«"']([^«"']+)[»"']/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  const patterns = [
    /^(?:cancel|delete|remove|отмени|удали|скасуй|borrar|cancelar|lösch|entfern)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)\s+(?:called|named|titled|about|про|про\s+тему|на\s+тему|titled)\s+(.+)$/i,
    /^(?:cancel|delete|remove|отмени|удали|скасуй|borrar|cancelar|lösch|entfern)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)\s+(.+)$/i,
    /^(?:отмени|скасуй)\s+напоминание\s+(?:про|о|на)\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

export function cancelReminderExactOnly(raw: string) {
  const lower = raw.toLowerCase();
  return (
    /[«"']/.test(raw) ||
    /\b(?:exactly|exact|точно|саме|genau)\b/.test(lower) ||
    /\b(?:called|named|titled|про\s+тему|на\s+тему)\b/.test(lower)
  );
}

export function isSnoozeReminderPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:snooze|отложи|відклади|posponer|aplazar|verschieb(?:en)?)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)/.test(
      lower,
    ) ||
    /^(?:snooze|отложи)\s+(?:for|на|por|um)\b/.test(lower) ||
    /^(?:reminder|напоминание|нагадування)\s+(?:snooze|snoozed|отложи|відклади)/.test(lower)
  );
}

export function extractSnoozeReminderTitle(raw: string) {
  const quoted = raw.trim().match(/[«"']([^«"']+)[»"']/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  const patterns = [
    /^(?:snooze|отложи|відклади|posponer|aplazar|verschieb(?:en)?)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)\s+(?:called|named|about|про|о)\s+(.+?)\s+(?:for|на|por|um|in|через)\s+/i,
    /^(?:snooze|отложи|відклади|posponer|aplazar|verschieb(?:en)?)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)\s+(.+?)\s+(?:for|на|por|um|in|через)\s+/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

export function isRescheduleReminderPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:reschedule|postpone|move|delay|shift|перенес(?:и|ите|ь)?|перенести|сдвинь|відклади|перенеси|reprogramar|aplazar|verschieb)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)/.test(
      lower,
    ) ||
    /^(?:reminder|напоминание|нагадування)\s+(?:to|on|at|на|к|до)\s+/i.test(lower)
  );
}

export function extractRescheduleReminderTitle(raw: string) {
  const quoted = raw.trim().match(/[«"']([^«"']+)[»"']/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  const patterns = [
    /^(?:reschedule|postpone|move|delay|shift|перенес(?:и|ите|ь)?|перенести|сдвинь|відклади|перенеси|reprogramar|aplazar|verschieb)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)\s+(?:called|named|titled|about|про|о)\s+(.+?)\s+(?:to|on|at|на|к|до)\s+/i,
    /^(?:reschedule|postpone|move|delay|shift|перенес(?:и|ите|ь)?|перенести|сдвинь|відклади|перенеси|reprogramar|aplazar|verschieb)\s+(?:the\s+)?(?:reminder|напоминание|нагадування|recordatorio|erinnerung)\s+(.+?)\s+(?:to|on|at|на|к|до)\s+/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

export async function rescheduleUpcomingReminder(title: string | undefined, reminderTime: string) {
  const hit = await fetchFirstUpcomingReminder(title);
  if (!hit) return null;
  const { updateReminderTime } = await import("@/lib/voice-reminder-engine");
  const updated = await updateReminderTime(hit.id, reminderTime);
  return { ...hit, reminderTime: updated.reminder_time };
}
