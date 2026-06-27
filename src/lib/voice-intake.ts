import {
  clearProcessedVoiceInboxInDb,
  deleteVoiceInboxFromDb,
  fetchVoiceInboxFromDb,
  insertVoiceInboxToDb,
  migrateLocalVoiceInboxToDb,
  patchVoiceInboxInDb,
} from "@/lib/voice-inbox-engine";
import { supabase } from "@/integrations/supabase/client";
import type { VoiceInboxItem, VoiceInboxKind } from "@/lib/voice-intake-types";
import { VOICE_INBOX_EVENT } from "@/lib/voice-intake-types";
export type { VoiceInboxItem, VoiceInboxKind, VoiceInboxStatus } from "@/lib/voice-intake-types";
export { VOICE_INBOX_EVENT } from "@/lib/voice-intake-types";

const STORAGE_KEY = "1inow:voice:inbox:v1";
const MIGRATED_KEY = "1inow:voice:inbox:migrated:v1";

function emitVoiceInboxUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VOICE_INBOX_EVENT));
}

function readLocalVoiceInbox(): VoiceInboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as VoiceInboxItem[];
    return parsed.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function writeLocalVoiceInbox(items: VoiceInboxItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitVoiceInboxUpdated();
}

async function isSignedIn() {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

async function ensureLocalMigration() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_KEY) === "1") return;
  if (!(await isSignedIn())) return;

  const local = readLocalVoiceInbox();
  if (local.length === 0) {
    window.localStorage.setItem(MIGRATED_KEY, "1");
    return;
  }

  try {
    await migrateLocalVoiceInboxToDb(local);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.setItem(MIGRATED_KEY, "1");
  } catch {
    // Keep local copies until DB migration succeeds.
  }
}

export async function syncVoiceInboxIfNeeded() {
  if (!(await isSignedIn())) return false;
  await ensureLocalMigration();
  emitVoiceInboxUpdated();
  return true;
}

export async function fetchVoiceInboxItems(): Promise<VoiceInboxItem[]> {
  if (!(await isSignedIn())) return readLocalVoiceInbox();

  await ensureLocalMigration();
  try {
    return await fetchVoiceInboxFromDb();
  } catch {
    return readLocalVoiceInbox();
  }
}

/** @deprecated Prefer fetchVoiceInboxItems() */
export function getVoiceInboxItems(): VoiceInboxItem[] {
  return readLocalVoiceInbox();
}

export async function saveVoiceInboxItem(input: {
  raw: string;
  title?: string;
  kind?: VoiceInboxKind;
  confidence?: VoiceInboxItem["confidence"];
  summary?: string;
}) {
  const raw = input.raw.trim();
  if (!raw) return null;

  const inferred = classifyVoiceInboxText(raw);
  const payload = {
    raw,
    title: cleanupTitle(input.title || inferred.title || raw),
    kind: input.kind || inferred.kind,
    confidence: input.confidence || inferred.confidence,
    summary: input.summary || inferred.summary,
  };

  if (await isSignedIn()) {
    try {
      const item = await insertVoiceInboxToDb(payload);
      emitVoiceInboxUpdated();
      return item;
    } catch {
      // fall through to local
    }
  }

  const item: VoiceInboxItem = {
    id: makeId(),
    ...payload,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  writeLocalVoiceInbox([item, ...readLocalVoiceInbox()].slice(0, 100));
  return item;
}

export async function updateVoiceInboxItem(id: string, patch: Partial<VoiceInboxItem>) {
  if (await isSignedIn()) {
    try {
      await patchVoiceInboxInDb(id, patch);
      emitVoiceInboxUpdated();
      return;
    } catch {
      // fall through
    }
  }

  const next = readLocalVoiceInbox().map((item) => (item.id === id ? { ...item, ...patch } : item));
  writeLocalVoiceInbox(next);
}

export async function deleteVoiceInboxItem(id: string) {
  if (await isSignedIn()) {
    try {
      await deleteVoiceInboxFromDb(id);
      emitVoiceInboxUpdated();
      return;
    } catch {
      // fall through
    }
  }
  writeLocalVoiceInbox(readLocalVoiceInbox().filter((item) => item.id !== id));
}

export async function clearProcessedVoiceInboxItems() {
  if (await isSignedIn()) {
    try {
      await clearProcessedVoiceInboxInDb();
      emitVoiceInboxUpdated();
      return;
    } catch {
      // fall through
    }
  }
  writeLocalVoiceInbox(readLocalVoiceInbox().filter((item) => item.status === "new"));
}

export function subscribeVoiceInbox(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(VOICE_INBOX_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(VOICE_INBOX_EVENT, onCustom);
  };
}

export function classifyVoiceInboxText(
  raw: string,
): Pick<VoiceInboxItem, "kind" | "title" | "confidence" | "summary"> {
  const text = raw.trim();
  const lower = normalize(text);

  if (
    includesAny(lower, [
      "create task",
      "new task",
      "add task",
      "создай задачу",
      "добавь задачу",
      "задача",
      "сделать",
      "купить",
      "позвони",
    ])
  ) {
    return {
      kind: "task",
      title: stripLeadingIntent(text, [
        "create task",
        "new task",
        "add task",
        "создай задачу",
        "добавь задачу",
        "задача",
      ]),
      confidence: "high",
      summary: "Likely task. Review and create when ready.",
    };
  }

  if (
    includesAny(lower, [
      "create project",
      "new project",
      "add project",
      "создай проект",
      "добавь проект",
      "проект",
      "запуск",
    ])
  ) {
    return {
      kind: "project",
      title: stripLeadingIntent(text, [
        "create project",
        "new project",
        "add project",
        "создай проект",
        "добавь проект",
        "проект",
      ]),
      confidence: "high",
      summary: "Likely project. Review scope before creating.",
    };
  }

  if (includesAny(lower, ["remind", "reminder", "напомни", "напоминание"])) {
    return {
      kind: "reminder",
      title: stripLeadingIntent(text, [
        "remind me",
        "remind",
        "reminder",
        "напомни",
        "напоминание",
      ]),
      confidence: "medium",
      summary: "Reminder draft. Needs date/time flow before execution.",
    };
  }

  if (includesAny(lower, ["risk", "problem", "blocker", "риск", "проблема", "блокер"])) {
    return {
      kind: "risk",
      title: text,
      confidence: "medium",
      summary: "Risk signal. Attach it to a project or create a follow-up task.",
    };
  }

  if (includesAny(lower, ["note", "idea", "remember", "заметка", "идея", "запиши", "мысль"])) {
    return {
      kind: "note",
      title: stripLeadingIntent(text, ["note", "idea", "remember", "заметка", "идея", "запиши"]),
      confidence: "medium",
      summary: "Note draft. Keep it here until the Notes module is connected.",
    };
  }

  if (includesAny(lower, ["open", "go to", "открой", "перейди"])) {
    return {
      kind: "navigation",
      title: text,
      confidence: "medium",
      summary: "Navigation command. Use the voice center to execute it.",
    };
  }

  if (includesAny(lower, ["search", "find", "найди", "поиск"])) {
    return {
      kind: "search",
      title: text,
      confidence: "medium",
      summary: "Search request. Use global search or attach it to a task.",
    };
  }

  return {
    kind: "unknown",
    title: text,
    confidence: "low",
    summary:
      "Captured thought. Decide later whether it is a task, project, note, reminder, or risk.",
  };
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function cleanupTitle(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 160) || "Untitled voice item";
}

function stripLeadingIntent(value: string, phrases: string[]) {
  const normalized = normalize(value);
  const phrase = phrases.find((item) => normalized.startsWith(item));
  if (!phrase) return cleanupTitle(value);
  return cleanupTitle(value.slice(phrase.length));
}
