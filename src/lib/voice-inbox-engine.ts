import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { supabase } from "@/integrations/supabase/client";
import type { VoiceInboxItem, VoiceInboxKind, VoiceInboxStatus } from "@/lib/voice-intake-types";

type VoiceInboxRow = {
  id: string;
  raw_text: string;
  title: string;
  kind: string;
  status: string;
  confidence: string;
  summary: string | null;
  processed_at: string | null;
  created_at: string;
};

function mapRow(row: VoiceInboxRow): VoiceInboxItem {
  return {
    id: row.id,
    raw: row.raw_text,
    title: row.title,
    kind: row.kind as VoiceInboxKind,
    status: row.status as VoiceInboxStatus,
    confidence: row.confidence as VoiceInboxItem["confidence"],
    summary: row.summary ?? "",
    createdAt: row.created_at,
    processedAt: row.processed_at ?? undefined,
  };
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required");
  return data.user.id;
}

export async function fetchVoiceInboxFromDb(limit = 100) {
  const { data, error } = await supabase
    .from("voice_inbox_items")
    .select("id, raw_text, title, kind, status, confidence, summary, processed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as VoiceInboxRow));
}

export async function insertVoiceInboxToDb(input: {
  raw: string;
  title: string;
  kind: VoiceInboxKind;
  confidence: VoiceInboxItem["confidence"];
  summary: string;
}) {
  const userId = await requireUserId();
  const organizationId = await resolveActiveOrganizationId(userId).catch(() => null);

  const { data, error } = await supabase
    .from("voice_inbox_items")
    .insert({
      user_id: userId,
      organization_id: organizationId,
      raw_text: input.raw,
      title: input.title,
      kind: input.kind,
      status: "new",
      confidence: input.confidence,
      summary: input.summary,
    })
    .select("id, raw_text, title, kind, status, confidence, summary, processed_at, created_at")
    .single();

  if (error) throw error;
  return mapRow(data as VoiceInboxRow);
}

export async function patchVoiceInboxInDb(id: string, patch: Partial<VoiceInboxItem>) {
  const payload: Record<string, unknown> = {};
  if (patch.raw !== undefined) payload.raw_text = patch.raw;
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.kind !== undefined) payload.kind = patch.kind;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.confidence !== undefined) payload.confidence = patch.confidence;
  if (patch.summary !== undefined) payload.summary = patch.summary;
  if (patch.processedAt !== undefined) payload.processed_at = patch.processedAt;

  const { error } = await supabase.from("voice_inbox_items").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteVoiceInboxFromDb(id: string) {
  const { error } = await supabase.from("voice_inbox_items").delete().eq("id", id);
  if (error) throw error;
}

export async function clearProcessedVoiceInboxInDb() {
  const { error } = await supabase.from("voice_inbox_items").delete().neq("status", "new");
  if (error) throw error;
}

export async function migrateLocalVoiceInboxToDb(localItems: VoiceInboxItem[]) {
  if (localItems.length === 0) return 0;
  const userId = await requireUserId();
  const organizationId = await resolveActiveOrganizationId(userId).catch(() => null);

  const rows = localItems.slice(0, 100).map((item) => ({
    user_id: userId,
    organization_id: organizationId,
    raw_text: item.raw,
    title: item.title,
    kind: item.kind,
    status: item.status,
    confidence: item.confidence,
    summary: item.summary,
    processed_at: item.processedAt ?? null,
    created_at: item.createdAt,
  }));

  const { error } = await supabase.from("voice_inbox_items").insert(rows);
  if (error) throw error;
  return rows.length;
}
