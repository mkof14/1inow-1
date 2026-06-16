import { supabase } from "@/integrations/supabase/client";

export const MESSAGE_TYPES = [
  "normal","update","decision","action_item","question","blocker",
  "approval","announcement","file_share","meeting_note",
] as const;
export type MessageType = typeof MESSAGE_TYPES[number];

export const MESSAGE_TYPE_META: Record<MessageType, { label: string; color: string; icon: string }> = {
  normal:        { label: "Message",      color: "border-l-transparent",        icon: "💬" },
  update:        { label: "Update",       color: "border-l-blue-500",           icon: "📣" },
  decision:      { label: "Decision",     color: "border-l-purple-500",         icon: "⚖️" },
  action_item:   { label: "Action Item",  color: "border-l-amber-500",          icon: "✅" },
  question:      { label: "Question",     color: "border-l-cyan-500",           icon: "❓" },
  blocker:       { label: "Blocker",      color: "border-l-red-500",            icon: "🚧" },
  approval:      { label: "Approval",     color: "border-l-emerald-500",        icon: "🛡️" },
  announcement:  { label: "Announcement", color: "border-l-pink-500",           icon: "📢" },
  file_share:    { label: "File",         color: "border-l-slate-500",          icon: "📎" },
  meeting_note:  { label: "Meeting Note", color: "border-l-indigo-500",         icon: "🗒️" },
};

export type Channel = {
  id: string; name: string; slug: string | null; type: string;
  description: string | null; project_id: string | null;
  created_by: string | null; archived_at: string | null;
  created_at: string; updated_at: string;
};

export type Message = {
  id: string; channel_id: string; author_id: string | null;
  body: string; message_type: MessageType;
  thread_root_id: string | null;
  edited_at: string | null; deleted_at: string | null; pinned_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string; updated_at: string;
  profiles?: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

// ============ CHANNELS ============
export async function fetchChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .is("archived_at", null)
    .order("type")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Channel[];
}

export async function createChannel(input: {
  name: string; type: "company" | "private" | "group" | "project"; description?: string; project_id?: string;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
  const { data, error } = await supabase
    .from("channels")
    .insert({
      name: input.name, slug, type: input.type,
      description: input.description ?? null,
      project_id: input.project_id ?? null,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function joinChannel(channelId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  await supabase.from("channel_members").upsert(
    { channel_id: channelId, user_id: user.id, role: "member" },
    { onConflict: "channel_id,user_id" },
  );
}

// ============ MESSAGES ============
export async function fetchMessages(channelId: string, threadRootId: string | null = null) {
  let q = supabase
    .from("messages")
    .select("*")
    .eq("channel_id", channelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);
  if (threadRootId === null) {
    q = q.is("thread_root_id", null);
  } else {
    q = q.eq("thread_root_id", threadRootId);
  }
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean))) as string[];
  let profilesById: Record<string, { id: string; full_name: string | null; avatar_url: string | null }> = {};
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url")
      .in("id", authorIds);
    profilesById = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
  }
  return rows.map((r) => ({
    ...r,
    profiles: r.author_id ? (profilesById[r.author_id] ?? null) : null,
  })) as unknown as Message[];
}

export async function sendMessage(input: {
  channel_id: string; body: string; message_type?: MessageType; thread_root_id?: string | null; original_language?: string;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  // Ensure membership (for non-company channels)
  await supabase.from("channel_members").upsert(
    { channel_id: input.channel_id, user_id: user.id, role: "member" },
    { onConflict: "channel_id,user_id" },
  );
  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: input.channel_id,
      author_id: user.id,
      body: input.body,
      message_type: input.message_type ?? "normal",
      thread_root_id: input.thread_root_id ?? null,
      original_language: input.original_language ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function editMessage(id: string, body: string) {
  const { error } = await supabase.from("messages").update({ body, edited_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function pinMessage(id: string, pinned: boolean) {
  const { error } = await supabase.from("messages").update({ pinned_at: pinned ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
}

// ============ REACTIONS ============
export async function fetchReactions(messageIds: string[]) {
  if (messageIds.length === 0) return [];
  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .in("message_id", messageIds);
  if (error) throw error;
  return data ?? [];
}

export async function toggleReaction(message_id: string, emoji: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", message_id).eq("user_id", user.id).eq("emoji", emoji)
    .maybeSingle();
  if (existing) {
    await supabase.from("message_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("message_reactions").insert({ message_id, user_id: user.id, emoji });
  }
}

// ============ SAVED ============
export async function toggleSavedMessage(message_id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  const { data: existing } = await supabase
    .from("saved_messages").select("id").eq("user_id", user.id).eq("message_id", message_id).maybeSingle();
  if (existing) { await supabase.from("saved_messages").delete().eq("id", existing.id); return false; }
  await supabase.from("saved_messages").insert({ user_id: user.id, message_id });
  return true;
}

// ============ CONVERSIONS ============
export async function convertMessageToTask(m: Message, projectId?: string | null) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("tasks").insert({
    title: m.body.slice(0, 120),
    description: `From #message ${m.id}\n\n${m.body}`,
    status: "todo",
    priority: m.message_type === "blocker" ? "high" : "medium",
    project_id: projectId ?? null,
    created_by: user.id,
  }).select().single();
  if (error) throw error;
  return data;
}

// ============ READ TRACKING ============
export async function markChannelRead(channelId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  await supabase.from("channel_members").upsert(
    { channel_id: channelId, user_id: user.id, role: "member", last_read_at: new Date().toISOString() },
    { onConflict: "channel_id,user_id" },
  );
}