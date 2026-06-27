import {
  deleteTaskRecord,
  deleteProjectRecord,
  updateTaskAssignee,
  updateTaskDueDate,
  updateTaskStatus,
} from "@/lib/project-task-engine";
import { updateDecisionStatus } from "@/lib/decision-engine";
import { deleteMessage } from "@/lib/comm";
import type { Database } from "@/integrations/supabase/types";
import { popVoiceUndoGroup, peekVoiceUndoGroup, type VoiceUndoAction } from "@/lib/voice-undo";

export async function executeVoiceUndo(lang = "en") {
  const group = peekVoiceUndoGroup();
  if (!group) {
    return {
      ok: false as const,
      message: undoEmptyMessage(lang),
    };
  }

  try {
    const popped = popVoiceUndoGroup();
    if (!popped) {
      return { ok: false as const, message: undoEmptyMessage(lang) };
    }
    for (const action of [...popped.actions].reverse()) {
      await applyVoiceUndo(action);
    }
    const count = popped.actions.length;
    return {
      ok: true as const,
      message: undoSuccessMessage(lang, popped.label, count),
    };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Undo failed",
    };
  }
}

function undoEmptyMessage(lang: string) {
  if (lang.startsWith("ru")) return "Нечего отменять";
  if (lang.startsWith("uk")) return "Немає чого скасовувати";
  if (lang.startsWith("es")) return "Nada que deshacer";
  if (lang.startsWith("de")) return "Nichts rückgängig zu machen";
  return "Nothing to undo";
}

function undoSuccessMessage(lang: string, label: string, count: number) {
  if (lang.startsWith("ru")) {
    return count > 1 ? `Отменено ${count} действий: ${label}` : `Отменено: ${label}`;
  }
  if (lang.startsWith("uk")) {
    return count > 1 ? `Скасовано ${count} дій: ${label}` : `Скасовано: ${label}`;
  }
  if (lang.startsWith("es")) {
    return count > 1 ? `Deshechas ${count} acciones: ${label}` : `Deshecho: ${label}`;
  }
  if (lang.startsWith("de")) {
    return count > 1 ? `${count} Aktionen rückgängig: ${label}` : `Rückgängig: ${label}`;
  }
  return count > 1 ? `Undone ${count} actions: ${label}` : `Undone: ${label}`;
}

async function applyVoiceUndo(action: VoiceUndoAction) {
  if (action.kind === "delete_task") {
    await deleteTaskRecord(action.taskId);
    return;
  }
  if (action.kind === "restore_task_status") {
    await updateTaskStatus(
      action.taskId,
      action.status as Database["public"]["Enums"]["task_status"],
    );
    return;
  }
  if (action.kind === "restore_task_assignee") {
    await updateTaskAssignee(action.taskId, action.assigneeId);
    return;
  }
  if (action.kind === "restore_task_due") {
    await updateTaskDueDate(action.taskId, action.dueDate);
    return;
  }
  if (action.kind === "delete_project") {
    await deleteProjectRecord(action.projectId);
    return;
  }
  if (action.kind === "restore_decision_status") {
    await updateDecisionStatus(
      action.decisionId,
      action.status as Database["public"]["Enums"]["decision_status"],
    );
    return;
  }
  if (action.kind === "delete_message") {
    await deleteMessage(action.messageId);
    return;
  }
  if (action.kind === "restore_reminder_status") {
    const { cancelReminderRecord } = await import("@/lib/voice-reminder-engine");
    await cancelReminderRecord(
      action.reminderId,
      action.status as "pending" | "canceled" | "sent",
    );
    return;
  }
  if (action.kind === "restore_reminder_time") {
    const { updateReminderTime } = await import("@/lib/voice-reminder-engine");
    await updateReminderTime(action.reminderId, action.reminderTime);
    return;
  }
  if (action.kind === "delete_reminder") {
    const { cancelReminderRecord } = await import("@/lib/voice-reminder-engine");
    await cancelReminderRecord(action.reminderId, "canceled");
  }
}
