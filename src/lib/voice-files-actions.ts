export function isSearchFilesPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:search|find|look for|найди|ищи|шукай|buscar|finde|suche)\s+(?:a\s+)?(?:file|files|document|документ|файл|файли|archivo|datei)/.test(
      lower,
    ) ||
    /^(?:find in vault|search vault|найди в vault|поиск в vault|шукай у vault)/.test(lower)
  );
}

export function extractSearchFilesQuery(raw: string) {
  const patterns = [
    /^(?:search|find|look for|найди|ищи|шукай|buscar|finde|suche)\s+(?:a\s+)?(?:file|files|document|документ|файл|файли|archivo|datei)\s+(.+)$/i,
    /^(?:find in vault|search vault|найди в vault|шукай у vault)\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

export function filesSearchStubMessage(lang = "en", query?: string) {
  const q = query ? ` «${query}»` : "";
  if (lang.startsWith("uk")) return `Пошук у Vault скоро${q} — поки відкриваю Files.`;
  if (lang.startsWith("ru")) return `Поиск в Vault скоро${q} — пока открываю Files.`;
  if (lang.startsWith("es")) return `Búsqueda en Vault pronto${q} — abriendo Files.`;
  if (lang.startsWith("de")) return `Vault-Suche kommt bald${q} — öffne Files.`;
  return `Vault file search is coming soon${q} — opening Files.`;
}
