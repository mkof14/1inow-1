import { supabase } from "@/integrations/supabase/client";
import { deliverInAppNotification } from "@/lib/notifications";
import { logWorkspaceActivity } from "@/lib/activity-log";

export type CreateReminderInput = {
  title: string;
  message?: string | null;
  reminderTime: string;
  priority?: "low" | "normal" | "high";
  relatedObjectType?: string | null;
  relatedObjectId?: string | null;
};

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required");
  return data.user.id;
}

export async function createReminderRecord(input: CreateReminderInput) {
  const userId = await requireUserId();
  const title = input.title.trim();
  if (!title) throw new Error("Reminder title is required");
  const when = new Date(input.reminderTime);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid reminder time");

  const { data, error } = await supabase
    .from("ai_reminders")
    .insert({
      user_id: userId,
      title,
      message: input.message ?? null,
      reminder_time: when.toISOString(),
      priority: input.priority ?? "normal",
      status: "pending",
      related_object_type: input.relatedObjectType ?? null,
      related_object_id: input.relatedObjectId ?? null,
    })
    .select("id, title, reminder_time")
    .single();

  if (error) throw error;

  await logWorkspaceActivity({
    userId,
    action: "reminder.created",
    entityType: "reminder",
    entityId: data.id,
    metadata: { title, reminderTime: when.toISOString() },
  }).catch(() => undefined);

  return data;
}

export async function cancelReminderRecord(reminderId: string, status: "pending" | "canceled" | "sent" = "canceled") {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("ai_reminders")
    .update({ status })
    .eq("id", reminderId)
    .eq("user_id", userId)
    .select("id, title, status")
    .single();
  if (error) throw error;
  return data;
}

export async function readReminderSnapshot(reminderId: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("ai_reminders")
    .select("id, title, reminder_time, status")
    .eq("id", reminderId)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateReminderTime(reminderId: string, reminderTime: string) {
  const userId = await requireUserId();
  const when = new Date(reminderTime);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid reminder time");
  const { data, error } = await supabase
    .from("ai_reminders")
    .update({ reminder_time: when.toISOString() })
    .eq("id", reminderId)
    .eq("user_id", userId)
    .select("id, title, reminder_time")
    .single();
  if (error) throw error;
  return data;
}

/** Client-side check — fires in-app notification when due (while app is open). */
const firedReminderIds = new Set<string>();

export function startReminderWatcher(onFire?: (title: string) => void) {
  if (typeof window === "undefined") return () => {};

  const tick = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ai_reminders")
      .select("id, title, message, reminder_time")
      .eq("user_id", auth.user.id)
      .eq("status", "pending")
      .lte("reminder_time", now)
      .order("reminder_time", { ascending: true })
      .limit(5);

    if (error || !data?.length) return;

    for (const row of data) {
      if (firedReminderIds.has(row.id)) continue;
      firedReminderIds.add(row.id);

      await supabase.from("ai_reminders").update({ status: "sent" }).eq("id", row.id);

      await deliverInAppNotification({
        userId: auth.user.id,
        type: "deadline",
        title: row.title,
        body: row.message ?? "Reminder",
        entityType: "reminder",
        entityId: row.id,
        url: "/intelligence?tab=reminders",
      }).catch(() => undefined);

      onFire?.(row.title);
    }
  };

  void tick();
  const id = window.setInterval(() => void tick(), 30_000);
  return () => window.clearInterval(id);
}
