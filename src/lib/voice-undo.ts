/** Reversible voice mutations — undo last workspace action or batch (Phase 16 / 21). */

const STACK_KEY = "1inow:voice:undo-stack:v1";
const BATCH_KEY = "1inow:voice:undo-batch-buffer";
const MAX_GROUPS = 8;
const TTL_MS = 60 * 60 * 1000;

export type VoiceUndoAction =
  | { kind: "delete_task"; taskId: string; label: string }
  | { kind: "restore_task_status"; taskId: string; status: string; label: string }
  | { kind: "restore_task_assignee"; taskId: string; assigneeId: string | null; label: string }
  | { kind: "restore_task_due"; taskId: string; dueDate: string | null; label: string }
  | { kind: "delete_project"; projectId: string; label: string }
  | { kind: "restore_decision_status"; decisionId: string; status: string; label: string }
  | { kind: "delete_message"; messageId: string; label: string }
  | { kind: "restore_reminder_status"; reminderId: string; status: string; label: string }
  | { kind: "restore_reminder_time"; reminderId: string; reminderTime: string; label: string }
  | { kind: "delete_reminder"; reminderId: string; label: string };

export type VoiceUndoGroup = {
  savedAt: number;
  label: string;
  actions: VoiceUndoAction[];
};

function readStack(): VoiceUndoGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VoiceUndoGroup[];
    const now = Date.now();
    return (parsed ?? []).filter((g) => g?.actions?.length && now - (g.savedAt ?? 0) < TTL_MS);
  } catch {
    return [];
  }
}

function writeStack(stack: VoiceUndoGroup[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(0, MAX_GROUPS)));
  } catch {}
}

function pushGroup(group: Omit<VoiceUndoGroup, "savedAt">) {
  const stack = readStack();
  writeStack([{ ...group, savedAt: Date.now() }, ...stack]);
}

export function startVoiceUndoBatch() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BATCH_KEY, JSON.stringify([]));
  } catch {}
}

export function cancelVoiceUndoBatch() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BATCH_KEY);
  } catch {}
}

export function finishVoiceUndoBatch(label: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(BATCH_KEY);
    window.sessionStorage.removeItem(BATCH_KEY);
    if (!raw) return;
    const actions = JSON.parse(raw) as VoiceUndoAction[];
    if (!actions.length) return;
    pushGroup({ label, actions });
  } catch {}
}

export function saveVoiceUndo(action: VoiceUndoAction) {
  if (typeof window === "undefined") return;
  try {
    const batchRaw = window.sessionStorage.getItem(BATCH_KEY);
    if (batchRaw !== null) {
      const batch = JSON.parse(batchRaw) as VoiceUndoAction[];
      batch.push(action);
      window.sessionStorage.setItem(BATCH_KEY, JSON.stringify(batch));
      return;
    }
    pushGroup({ label: action.label, actions: [action] });
  } catch {}
}

/** @deprecated Prefer popVoiceUndoGroup */
export function loadVoiceUndo(): VoiceUndoAction | null {
  const group = peekVoiceUndoGroup();
  return group?.actions[group.actions.length - 1] ?? null;
}

export function peekVoiceUndoGroup(): VoiceUndoGroup | null {
  return readStack()[0] ?? null;
}

export function popVoiceUndoGroup(): VoiceUndoGroup | null {
  const stack = readStack();
  if (!stack.length) return null;
  const [head, ...rest] = stack;
  writeStack(rest);
  return head ?? null;
}

export function clearVoiceUndo() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STACK_KEY);
    window.sessionStorage.removeItem(BATCH_KEY);
  } catch {}
}

export function isUndoLastActionPhrase(raw: string) {
  const n = raw.toLowerCase().replace(/[.,!?;:]+/g, " ").trim();
  const phrases = [
    "undo last action",
    "undo that",
    "undo it",
    "take that back",
    "отмени последнее",
    "отмени последнее действие",
    "верни как было",
    "скасуй останнє",
    "скасуй останню дію",
    "скасуй останнє",
    "поверни як було",
    "deshacer",
    "deshacer ultimo",
    "rückgängig",
    "letzte aktion rückgängig",
  ];
  return phrases.some((p) => n === p || n.startsWith(`${p} `) || n.endsWith(` ${p}`));
}

export function isUndoBatchPhrase(raw: string) {
  const n = raw.toLowerCase().replace(/[.,!?;:]+/g, " ").trim();
  const phrases = [
    "undo batch",
    "undo all",
    "undo everything",
    "отмени всё",
    "отмени все",
    "скасуй все",
    "скасуй пакет",
    "скасуй все",
    "скасуй пакет дій",
    "deshacer todo",
    "alles rückgängig",
  ];
  return phrases.some((p) => n === p || n.startsWith(`${p} `) || n.endsWith(` ${p}`));
}
