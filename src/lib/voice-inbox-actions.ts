import { createProjectRecord, createTaskRecord } from "@/lib/project-task-engine";
import { createReminderRecord } from "@/lib/voice-reminder-engine";
import {
  fetchVoiceInboxItems,
  updateVoiceInboxItem,
  type VoiceInboxItem,
} from "@/lib/voice-intake";
import { parseReminderDateTime } from "@/lib/voice-reminder-time";

export type InboxProcessAction = "auto" | "task" | "project" | "reminder" | "dismiss";

export async function fetchFirstNewVoiceInboxItem(): Promise<VoiceInboxItem | null> {
  const items = await fetchVoiceInboxItems();
  return items.find((item) => item.status === "new") ?? null;
}

export async function fetchNewVoiceInboxCount() {
  const items = await fetchVoiceInboxItems();
  return items.filter((item) => item.status === "new").length;
}

export function voiceInboxStatMessage(count: number, lang = "en") {
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  if (count === 0) {
    return ru ? "Voice Inbox пуст." : es ? "Voice Inbox vacío." : de ? "Voice Inbox ist leer." : "Voice Inbox is empty.";
  }
  return ru
    ? `В Voice Inbox ${count} нов${count === 1 ? "ый пункт" : count < 5 ? "ых пункта" : "ых пунктов"}.`
    : es
      ? `${count} elemento${count === 1 ? "" : "s"} nuevo${count === 1 ? "" : "s"} en Voice Inbox.`
      : de
        ? `${count} neue${count === 1 ? "r" : ""} Voice-Inbox-Eintrag${count === 1 ? "" : "e"}.`
        : `${count} new Voice Inbox item${count === 1 ? "" : "s"}.`;
}

export function isVoiceInboxCountQuestion(raw: string) {
  const lower = raw.toLowerCase().trim();
  return /^(?:how many.*(?:voice inbox|voice items)|сколько.*(?:voice inbox|голосов|в инбокс)|скільки.*voice inbox|cuántos.*(?:voice inbox|inbox de voz)|wie viele.*voice)/.test(
    lower,
  );
}

export function isOpenVoiceInboxPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:open|show|go to|открой|покажи|відкрий|abrir|mostrar|öffne)\s+(?:the\s+)?(?:voice inbox|голосовой инбокс|voice|голосов|inbox de voz|sprach-inbox)/.test(
      lower,
    ) ||
    /^(?:voice inbox|голосовой инбокс|inbox de voz|sprach-inbox)$/.test(lower)
  );
}

export function isConvertInboxNotePhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /(?:turn|convert|make|преврат|сделай|створи|перетвор|convertir|umwandeln).*(?:note|заметк|нотатк|nota|notiz).*(?:task|задач|tarea|aufgabe)/.test(
      lower,
    ) ||
    /(?:task from|задач(?:у|а) из).*(?:note|заметк|first note|перв(?:ой|ую) замет)/.test(lower) ||
    /^(?:convert note|note to task|заметку в задачу|заметка в задачу)/.test(lower)
  );
}

function resolveInboxAction(item: VoiceInboxItem, action: InboxProcessAction): InboxProcessAction {
  if (action !== "auto") return action;
  if (item.kind === "project") return "project";
  if (item.kind === "reminder") return "reminder";
  if (item.kind === "navigation" || item.kind === "search") return "dismiss";
  return "task";
}

export type ProcessInboxResult = {
  item: VoiceInboxItem;
  action: InboxProcessAction;
  entityType?: "task" | "project" | "reminder";
  entityId?: string;
};

export async function processVoiceInboxItem(
  item: VoiceInboxItem,
  action: InboxProcessAction = "auto",
): Promise<ProcessInboxResult> {
  const resolved = resolveInboxAction(item, action);

  if (resolved === "dismiss") {
    await updateVoiceInboxItem(item.id, {
      status: "processed",
      processedAt: new Date().toISOString(),
    });
    return { item, action: resolved };
  }

  if (resolved === "project") {
    const project = await createProjectRecord({
      name: item.title || "Voice project",
      description: `From Voice Inbox: ${item.raw}`,
    });
    await updateVoiceInboxItem(item.id, {
      status: "processed",
      processedAt: new Date().toISOString(),
    });
    return { item, action: resolved, entityType: "project", entityId: project.id };
  }

  if (resolved === "reminder") {
    const reminderTime =
      parseReminderDateTime(item.raw) ?? parseReminderDateTime(`${item.title} tomorrow at 9:00`);
    if (reminderTime) {
      const reminder = await createReminderRecord({
        title: item.title,
        message: item.raw,
        reminderTime,
      });
      await updateVoiceInboxItem(item.id, {
        status: "processed",
        processedAt: new Date().toISOString(),
      });
      return { item, action: resolved, entityType: "reminder", entityId: reminder.id };
    }
  }

  const task = await createTaskRecord({
    title: item.title,
    description: `From Voice Inbox: ${item.raw}`,
    priority: item.kind === "risk" ? "high" : "medium",
  });
  await updateVoiceInboxItem(item.id, {
    status: "processed",
    processedAt: new Date().toISOString(),
  });
  return { item, action: "task", entityType: "task", entityId: task.id };
}

export async function fetchFirstNewNoteInboxItem(): Promise<VoiceInboxItem | null> {
  const items = await fetchVoiceInboxItems();
  return items.find((item) => item.status === "new" && item.kind === "note") ?? null;
}

export async function convertInboxNoteToTask(item: VoiceInboxItem): Promise<ProcessInboxResult> {
  const task = await createTaskRecord({
    title: item.title || "Note task",
    description: item.raw || item.title || null,
  });
  await updateVoiceInboxItem(item.id, {
    status: "processed",
    processedAt: new Date().toISOString(),
  });
  return { item, action: "task", entityType: "task", entityId: task.id };
}

/** Mark inbox item done without creating workspace entities. */
export async function dismissVoiceInboxItem(item: VoiceInboxItem): Promise<ProcessInboxResult> {
  await updateVoiceInboxItem(item.id, {
    status: "processed",
    processedAt: new Date().toISOString(),
  });
  return { item, action: "dismiss" };
}
