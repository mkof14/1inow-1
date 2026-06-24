export type VoiceInboxKind =
  | "task"
  | "project"
  | "note"
  | "reminder"
  | "risk"
  | "search"
  | "navigation"
  | "unknown";
export type VoiceInboxStatus = "new" | "processed" | "dismissed";

export type VoiceInboxItem = {
  id: string;
  raw: string;
  title: string;
  kind: VoiceInboxKind;
  status: VoiceInboxStatus;
  confidence: "high" | "medium" | "low";
  summary: string;
  createdAt: string;
  processedAt?: string;
};

const STORAGE_KEY = "1inow:voice:inbox:v1";
const EVENT_NAME = "1inow:voice-inbox-updated";

export function getVoiceInboxItems(): VoiceInboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as VoiceInboxItem[];
    return parsed.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function saveVoiceInboxItem(input: {
  raw: string;
  title?: string;
  kind?: VoiceInboxKind;
  confidence?: VoiceInboxItem["confidence"];
  summary?: string;
}) {
  const raw = input.raw.trim();
  if (!raw) return null;

  const inferred = classifyVoiceInboxText(raw);
  const item: VoiceInboxItem = {
    id: makeId(),
    raw,
    title: cleanupTitle(input.title || inferred.title || raw),
    kind: input.kind || inferred.kind,
    status: "new",
    confidence: input.confidence || inferred.confidence,
    summary: input.summary || inferred.summary,
    createdAt: new Date().toISOString(),
  };

  const next = [item, ...getVoiceInboxItems()].slice(0, 100);
  writeVoiceInboxItems(next);
  return item;
}

export function updateVoiceInboxItem(id: string, patch: Partial<VoiceInboxItem>) {
  const next = getVoiceInboxItems().map((item) => (item.id === id ? { ...item, ...patch } : item));
  writeVoiceInboxItems(next);
}

export function deleteVoiceInboxItem(id: string) {
  writeVoiceInboxItems(getVoiceInboxItems().filter((item) => item.id !== id));
}

export function clearProcessedVoiceInboxItems() {
  writeVoiceInboxItems(getVoiceInboxItems().filter((item) => item.status === "new"));
}

export function subscribeVoiceInbox(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT_NAME, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT_NAME, onCustom);
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

function writeVoiceInboxItems(items: VoiceInboxItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
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
