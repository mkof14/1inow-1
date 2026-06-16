import { supabase } from "@/integrations/supabase/client";

export type EntityType = "project" | "task" | "document" | "channel" | "report" | "note" | "file" | "meeting";

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
export async function fetchNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function markNotification(id: string, fields: { read_at?: string | null; resolved_at?: string | null }) {
  const { error } = await supabase.from("notifications").update(fields).eq("id", id);
  if (error) throw error;
}

export async function markAllRead() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
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

type SettingsPatch = Partial<{
  language: string;
  timezone: string;
  theme: string;
  default_project_view: string;
  notifications: Record<string, unknown>;
  working_hours: Record<string, unknown>;
}>;

export async function saveSettings(patch: SettingsPatch) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("user_settings").update(patch).eq("user_id", user.id);
  if (error) throw error;
}