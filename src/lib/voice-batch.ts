/** Split compound voice utterances into sequential commands (Phase 15). */

const BATCH_SEPARATORS: RegExp[] = [
  /\s+and then\s+/i,
  /\s+then\s+/i,
  /\s+и потом\s+/i,
  /\s+затем\s+/i,
  /\s+а потом\s+/i,
  /\s+потом\s+/i,
  /\s+і потім\s+/i,
  /\s+потім\s+/i,
  /\s+а потім\s+/i,
  /\s+i potom\s+/i,
  /\s+y luego\s+/i,
  /\s+und dann\s+/i,
  /\s+dann\s+/i,
  /\s+и\s+(?:открой|покажи|перейди|создай|напомни|open|show|go to|create|remind)\s+/i,
  /\s+and\s+(?:open|show|go to|create|remind)\s+/i,
  /\s*,\s*(?:then|and|и|potom|luego|dann)\s+/i,
  /\s+;\s+/,
  /\s+y\s+(?:abre|abrir|mostrar|crear|recuérdame)\s+/i,
  /\s+und\s+(?:öffne|zeige|erstelle|erinnere)\s+/i,
];

export function splitBatchUtterance(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  let parts = [trimmed];
  for (const sep of BATCH_SEPARATORS) {
    parts = parts.flatMap((part) => {
      const split = part
        .split(sep)
        .map((s) => s.trim())
        .filter(Boolean);
      return split.length > 1 ? split : [part];
    });
  }

  return parts.length > 1 ? parts : [trimmed];
}

export function isBatchUtterance(raw: string) {
  return splitBatchUtterance(raw).length > 1;
}
