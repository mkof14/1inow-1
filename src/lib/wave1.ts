import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EntityType =
  | "project"
  | "task"
  | "document"
  | "channel"
  | "report"
  | "note"
  | "file"
  | "meeting";

// ============ FAVORITES ============
export async function fetchFavorites() {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function toggleFavorite(entity_type: EntityType, entity_id: string, label?: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("entity_type", entity_type)
    .eq("entity_id", entity_id)
    .maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return false;
  }
  await supabase.from("favorites").insert({ user_id: user.id, entity_type, entity_id, label });
  return true;
}

// ============ RECENT ITEMS ============
export async function fetchRecent(limit = 10) {
  const { data, error } = await supabase
    .from("recent_items")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function trackRecent(entity_type: EntityType, entity_id: string, label?: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  await supabase
    .from("recent_items")
    .upsert(
      { user_id: user.id, entity_type, entity_id, label, opened_at: new Date().toISOString() },
      { onConflict: "user_id,entity_type,entity_id" },
    );
}

// ============ NOTIFICATIONS ============
import {
  createNotification,
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotification,
} from "@/lib/notifications";

export { createNotification, deliverInAppNotification, markNotification };
export type {
  CreateNotificationInput,
  NotificationRow,
  NotificationType,
} from "@/lib/notifications";

export async function fetchNotifications() {
  return fetchMyNotifications();
}

export async function markAllRead() {
  return markAllNotificationsRead();
}

// ============ USER SETTINGS ============
export async function fetchSettings() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data) return data;
  const { data: created } = await supabase
    .from("user_settings")
    .insert({ user_id: user.id })
    .select()
    .single();
  return created;
}

type SettingsPatch = Database["public"]["Tables"]["user_settings"]["Update"];

export async function saveSettings(patch: SettingsPatch) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("user_settings").update(patch).eq("user_id", user.id);
  if (error) throw error;
}
