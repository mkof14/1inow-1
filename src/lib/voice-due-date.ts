/** Parse natural-language due dates from voice utterances. */

const DAY_MS = 86_400_000;

function startOfDay(d: Date) {
  const next = new Date(d);
  next.setHours(12, 0, 0, 0);
  return next;
}

function addDays(base: Date, days: number) {
  return startOfDay(new Date(base.getTime() + days * DAY_MS));
}

function nextWeekday(base: Date, target: number) {
  const d = startOfDay(base);
  const diff = (target - d.getDay() + 7) % 7 || 7;
  return addDays(d, diff);
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  воскресенье: 0,
  понедельник: 1,
  вторник: 2,
  среду: 2,
  среда: 2,
  четверг: 3,
  пятницу: 4,
  пятница: 4,
  субботу: 5,
  суббота: 5,
  понеділок: 1,
  вівторок: 2,
  середа: 2,
  четвер: 3,
  пятницю: 4,
  суботу: 5,
};

/** Extract ISO date (noon local) from a phrase fragment, or null. */
export function parseDueDateFromText(text: string, now = new Date()): string | null {
  const lower = text.toLowerCase().replace(/[.,!?;:«»"'`]+/g, " ").replace(/\s+/g, " ").trim();
  if (!lower) return null;

  if (/\b(today|сегодня|сьогодні)\b/.test(lower)) return addDays(now, 0).toISOString();
  if (/\b(tomorrow|завтра)\b/.test(lower)) return addDays(now, 1).toISOString();
  if (/\b(day after tomorrow|послезавтра|післязавтра)\b/.test(lower)) return addDays(now, 2).toISOString();
  if (/\b(next week|следующ(?:ая|ую) недел(?:ю|я)|наступн(?:ий|ого) тижден(?:ь|я))\b/.test(lower)) {
    return addDays(now, 7).toISOString();
  }

  const inDays = lower.match(/\b(?:in|через)\s+(\d{1,2})\s+(?:day|days|дн(?:я|ей|ень)|дні)\b/);
  if (inDays?.[1]) return addDays(now, Number(inDays[1])).toISOString();

  for (const [word, day] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b(?:next\\s+)?${word}\\b`, "i").test(lower)) {
      return nextWeekday(now, day).toISOString();
    }
  }

  const iso = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return startOfDay(new Date(iso[1])).toISOString();

  return null;
}

/** Pull due-date fragment from reschedule utterances. */
export function extractDueDateFragment(text: string): { taskPart: string; dueFragment: string | null } {
  const patterns = [
    /\b(?:to|on|for|until|by|на|к|до)\s+(.+)$/i,
    /\b(?:перенес(?:и|ите)|перенести|reschedule|move|postpone|delay)\b.+?\b(?:to|on|на|к|до)\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]?.trim()) {
      const dueFragment = m[1].trim();
      const taskPart = text.slice(0, m.index!).replace(/\b(?:to|on|for|until|by|на|к|до)\s*$/i, "").trim();
      return { taskPart, dueFragment };
    }
  }
  const bare = parseDueDateFromText(text);
  if (bare) return { taskPart: text, dueFragment: text };
  return { taskPart: text, dueFragment: null };
}

export function formatDueDateLabel(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleDateString(lang.startsWith("uk") ? "uk-UA" : lang.startsWith("ru") ? "ru-RU" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}
