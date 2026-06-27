/** Team Map voice helpers — find/focus members on the global map. */

export function isOpenTeamPersonPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:find|show|open|focus|locate|найди|покажи|открой|відкрий|знайди)\s+.+\s+(?:on|in|at|на|у)\s+(?:the\s+)?(?:team\s+map|team-map|карт[еи]\s+команд[ыи]|карті\s+команди|mapa\s+del\s+equipo|teamkarte)\b/.test(
      lower,
    ) ||
    /^(?:team\s+map|карт[ае]\s+команд[ыи]|карті\s+команди)\s+(?:find|show|open|найди|покажи|відкрий)\s+/.test(
      lower,
    )
  );
}

export function extractOpenTeamPersonName(raw: string) {
  const patterns = [
    /^(?:find|show|open|focus|locate|найди|покажи|открой|відкрий|знайди)\s+(.+?)\s+(?:on|in|at|на|у)\s+(?:the\s+)?(?:team\s+map|team-map|карт[еи]\s+команд[ыи]|карті\s+команди|mapa\s+del\s+equipo|teamkarte)\b.*$/i,
    /^(?:team\s+map|карт[ае]\s+команд[ыи]|карті\s+команди)\s+(?:find|show|open|найди|покажи|відкрий)\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

/** Short focus phrase when already on Team Map — «найди Иван», «show Maria». */
export function isFocusTeamMemberPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  if (isOpenTeamPersonPhrase(raw)) return false;
  return /^(?:find|show|focus|locate|where\s+is|найди|покажи|відкрий|знайди|де)\s+[«"']?.+[«"']?$/.test(lower);
}

export function extractFocusTeamMemberName(raw: string) {
  const patterns = [
    /^(?:find|show|focus|locate|where\s+is|найди|покажи|відкрий|знайди)\s+[«"']([^«"']+)[»"']$/i,
    /^(?:find|show|focus|locate|where\s+is|найди|покажи|відкрий|знайди|де)\s+(?:is\s+)?(.+)$/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

const TEAM_STATUS_ALIASES: Record<string, string> = {
  online: "online",
  онлайн: "online",
  offline: "offline",
  офлайн: "offline",
  busy: "busy",
  занят: "busy",
  заняты: "busy",
  away: "away",
  dnd: "dnd",
  "do not disturb": "dnd",
  небеспокоить: "dnd",
};

export function isFilterTeamMapPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|filter|list|who|покажи|фильтр|хто|кто)\s+(?:.+?\s+)?(?:on|in|at|на|у)\s+(?:the\s+)?(?:team\s+map|team-map|карт[еи]\s+команд[ыи]|карті\s+команди)/.test(
      lower,
    ) ||
    /^(?:team\s+map|карт[ае]\s+команд[ыи]|карті\s+команди)\s+(?:online|offline|busy|away|online|offline|онлайн|офлайн|timezone|часовой|часовий)/.test(
      lower,
    ) ||
    /^(?:who\s+is\s+online|кто\s+онлайн|хто\s+онлайн|online\s+team|онлайн\s+на\s+карт)/.test(lower)
  );
}

export function extractTeamMapFilter(raw: string): { status?: string; timezone?: string } {
  const lower = raw.toLowerCase();
  const result: { status?: string; timezone?: string } = {};

  for (const [alias, status] of Object.entries(TEAM_STATUS_ALIASES)) {
    if (new RegExp(`\\b${alias.replace(/\s+/g, "\\s+")}\\b`, "i").test(lower)) {
      result.status = status;
      break;
    }
  }

  const tzPatterns = [
    /(?:timezone|time zone|часов(?:ой|овой)\s+пояс|часовий\s+пояс|tz)\s+[«"']?([^«"'.!?]+)[»"']?/i,
    /(?:in|в)\s+(Europe\/[A-Za-z_]+|America\/[A-Za-z_]+|Asia\/[A-Za-z_]+|UTC(?:[+-]\d+)?|GMT(?:[+-]\d+)?)/i,
    /(?:timezone|часовой пояс)\s+(Europe\/[A-Za-z_]+|America\/[A-Za-z_]+|Asia\/[A-Za-z_]+)/i,
  ];
  for (const re of tzPatterns) {
    const m = raw.match(re);
    if (m?.[1]?.trim()) {
      result.timezone = m[1].trim();
      break;
    }
  }

  if (!result.timezone && /\beurope\b/i.test(lower)) result.timezone = "Europe";
  if (!result.timezone && /\bamerica\b/i.test(lower)) result.timezone = "America";
  if (!result.timezone && /\basia\b/i.test(lower)) result.timezone = "Asia";

  return result;
}
