/** Parse reminder date/time from natural voice phrases. */

import { parseDueDateFromText } from "@/lib/voice-due-date";
import { parseRelativeReminderOffset, hasRelativeReminderOffset } from "@/lib/voice-relative-time";

export type ParsedReminder = {
  reminderTime: string;
  title: string;
};

function combineDateAndTime(baseDate: Date, hour: number, minute: number) {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function parseClock(text: string): { hour: number; minute: number } | null {
  const lower = text.toLowerCase();

  const h24 = lower.match(/\b(?:at|in|в|о|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m|p\.m|утра|вечера|дня|ночи)?/i);
  if (h24?.[1]) {
    let hour = Number(h24[1]);
    const minute = h24[2] ? Number(h24[2]) : 0;
    const meridiem = h24[3]?.toLowerCase();
    if (meridiem === "pm" || meridiem === "p.m" || meridiem === "вечера" || meridiem === "дня") {
      if (hour < 12) hour += 12;
    } else if (meridiem === "am" || meridiem === "a.m" || meridiem === "утра") {
      if (hour === 12) hour = 0;
    } else if (!meridiem && hour <= 12 && /\b(?:pm|p\.m|вечера|дня)\b/i.test(lower)) {
      if (hour < 12) hour += 12;
    }
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
  }

  const bare = lower.match(/\b(\d{1,2}):(\d{2})\b/);
  if (bare?.[1]) {
    const hour = Number(bare[1]);
    const minute = Number(bare[2]);
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
  }

  return null;
}

function stripReminderPrefixes(text: string) {
  return text
    .replace(/^(remind me|reminder|remind|remember to|напомни|напоминание|нагадай|erinnere mich|erinnerung|recuérdame|recordatorio)\s+/i, "")
    .replace(/^(to|about|that|чтобы|про|о)\s+/i, "")
    .trim();
}

function stripTimePhrases(text: string) {
  return text
    .replace(/\b(?:at|in|в|о|@)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m|p\.m|утра|вечера|дня|ночи)?/gi, "")
    .replace(/\b(?:today|tomorrow|сегодня|завтра|monday|tuesday|wednesday|thursday|friday|saturday|sunday|понедельник|вторник|среду|среда|четверг|пятницу|субботу|воскресенье)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve reminder instant from utterance. */
export function parseReminderDateTime(text: string, now = new Date()): string | null {
  const relative = parseRelativeReminderOffset(text, now);
  if (relative) return relative;

  const clock = parseClock(text);
  if (!clock) return null;

  const dateIso = parseDueDateFromText(text, now);
  const base = dateIso ? new Date(dateIso) : new Date(now);
  if (!dateIso) {
    base.setHours(0, 0, 0, 0);
  }

  let instant = combineDateAndTime(base, clock.hour, clock.minute);
  if (!dateIso && instant.getTime() <= now.getTime()) {
    instant = combineDateAndTime(addDays(base, 1), clock.hour, clock.minute);
  }
  return instant.toISOString();
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function extractReminderTitle(text: string) {
  let title = stripReminderPrefixes(text);
  title = stripTimePhrases(title);
  title = title.replace(/\b(?:at|in|в|о)\s*$/i, "").trim();
  return title.length >= 2 ? title : "";
}

export function parseReminderUtterance(text: string, now = new Date()): ParsedReminder | null {
  const reminderTime = parseReminderDateTime(text, now);
  if (!reminderTime) return null;
  const title = extractReminderTitle(text) || text.trim();
  if (!title) return null;
  return { reminderTime, title };
}

export function formatReminderTime(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleString(
      lang.startsWith("uk") ? "uk-UA" : lang.startsWith("ru") ? "ru-RU" : "en-US",
      { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
    );
  } catch {
    return iso;
  }
}

/** True when utterance looks like a schedulable reminder (has clock or strong time signal). */
export function utteranceHasReminderSchedule(text: string) {
  return Boolean(hasRelativeReminderOffset(text) || parseClock(text) || parseDueDateFromText(text));
}
