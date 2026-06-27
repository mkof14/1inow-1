import type { VoicePlan } from "@/lib/voice-actions";

const STORAGE_KEY = "1inow:voice:offline-queue:v1";
const MAX_ITEMS = 20;

export type QueuedVoiceAction = {
  id: string;
  plan: VoicePlan;
  rawText: string;
  lang: string;
  savedAt: string;
  retries: number;
};

function readQueue(): QueuedVoiceAction[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as QueuedVoiceAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedVoiceAction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  window.dispatchEvent(new CustomEvent("1inow:voice-offline-queue"));
}

export function isVoiceOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export function getOfflineVoiceQueue(): QueuedVoiceAction[] {
  return readQueue();
}

export function getOfflineVoiceQueueCount() {
  return readQueue().length;
}

export function enqueueOfflineVoiceAction(plan: VoicePlan, rawText: string, lang: string) {
  const item: QueuedVoiceAction = {
    id: crypto.randomUUID(),
    plan,
    rawText,
    lang,
    savedAt: new Date().toISOString(),
    retries: 0,
  };
  writeQueue([item, ...readQueue()]);
  return item;
}

export function removeOfflineVoiceAction(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function clearOfflineVoiceQueue() {
  writeQueue([]);
}

export async function flushOfflineVoiceQueue(
  execute: (item: QueuedVoiceAction) => Promise<void>,
) {
  if (isVoiceOffline()) return { flushed: 0, failed: 0 };

  const queue = readQueue();
  if (!queue.length) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;
  const remaining: QueuedVoiceAction[] = [];

  for (const item of queue.reverse()) {
    try {
      await execute(item);
      flushed += 1;
    } catch {
      failed += 1;
      remaining.unshift({ ...item, retries: item.retries + 1 });
    }
  }

  writeQueue(remaining.filter((item) => item.retries < 3));
  return { flushed, failed };
}
