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
  if (lang.startsWith("uk")) return `Введіть запит для пошуку у Vault${q}.`;
  if (lang.startsWith("ru")) return `Введите запрос для поиска в Vault${q}.`;
  if (lang.startsWith("es")) return `Escribe una consulta para buscar en Vault${q}.`;
  if (lang.startsWith("de")) return `Suchbegriff für Vault eingeben${q}.`;
  return `Enter a query to search Vault${q}.`;
}

export { vaultSearchResultMessage } from "@/lib/vault-search";
