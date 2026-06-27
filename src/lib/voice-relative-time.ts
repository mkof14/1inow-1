/** Relative offsets for snooze / «через N минут» reminder scheduling. */

function addMs(now: Date, ms: number) {
  return new Date(now.getTime() + ms).toISOString();
}

export function parseRelativeReminderOffset(text: string, now = new Date()): string | null {
  const lower = text.toLowerCase().trim();

  if (/\b(?:half an hour|полчаса|media hora|halbe stunde|пів години)\b/.test(lower)) {
    return addMs(now, 30 * 60_000);
  }

  if (/\b(?:an hour|one hour|на час|через час|en una hora|in einer stunde|за годину)\b/.test(lower)) {
    return addMs(now, 60 * 60_000);
  }

  const unitPatterns: Array<{ re: RegExp; ms: (n: number) => number }> = [
    {
      re: /\b(?:in|через|en|za|for)\s+(\d+)\s*(?:m|min|mins|minutes?|мин(?:ут(?:у|ы)?)?|minutos?|minuten?)\b/i,
      ms: (n) => n * 60_000,
    },
    {
      re: /\b(?:in|через|en|za|for)\s+(\d+)\s*(?:h|hr|hrs|hours?|час(?:а|ов)?|horas?|stunden?)\b/i,
      ms: (n) => n * 60 * 60_000,
    },
    {
      re: /\b(?:in|через|en|za|for)\s+(\d+)\s*(?:d|days?|day|день|дня|дней|días|tag(?:e)?)\b/i,
      ms: (n) => n * 24 * 60 * 60_000,
    },
    {
      re: /\b(?:snooze|отложи|відклади|posponer|aplazar|verschieb(?:en)?)\s+(?:for\s+|на\s+|por\s+|um\s+)?(\d+)\s*(?:m|min|minutes?|мин(?:ут)?|minutos?|minuten?)\b/i,
      ms: (n) => n * 60_000,
    },
    {
      re: /\b(?:snooze|отложи|відклади|posponer|aplazar|verschieb(?:en)?)\s+(?:for\s+|на\s+|por\s+|um\s+)?(\d+)\s*(?:h|hr|hours?|час(?:а|ов)?|horas?|stunden?)\b/i,
      ms: (n) => n * 60 * 60_000,
    },
  ];

  for (const { re, ms } of unitPatterns) {
    const m = lower.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0 && n <= 10_000) return addMs(now, ms(n));
    }
  }

  if (/\b(?:snooze|отложи напоминание|posponer recordatorio|erinnerung verschieben)\b/.test(lower)) {
    return addMs(now, 15 * 60_000);
  }

  return null;
}

export function hasRelativeReminderOffset(text: string) {
  return Boolean(parseRelativeReminderOffset(text));
}
