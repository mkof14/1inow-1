import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationType =
  | "mention"
  | "task_update"
  | "comment"
  | "approval"
  | "message"
  | "deadline"
  | "assignment"
  | "system";

type NotificationPrefs = {
  email?: boolean;
  inapp?: boolean;
  mentions?: boolean;
  deadlines?: boolean;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  url?: string | null;
};

async function requireCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required");
  return data.user.id;
}

export async function fetchMyNotifications(limit = 100) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function createNotification(input: CreateNotificationInput) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      actor_id: input.actorId ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      url: input.url ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

async function isInAppNotificationsEnabled(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("notifications")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const prefs = (data?.notifications ?? {}) as NotificationPrefs;
  return prefs.inapp !== false;
}

/** Creates an in-app notification when recipient prefs allow and actor !== recipient. */
export async function deliverInAppNotification(input: CreateNotificationInput) {
  if (input.actorId && input.actorId === input.userId) return null;
  const enabled = await isInAppNotificationsEnabled(input.userId);
  if (!enabled) return null;
  return createNotification(input);
}

export async function markNotification(
  id: string,
  fields: { read_at?: string | null; resolved_at?: string | null },
) {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from("notifications")
    .update(fields)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
}
