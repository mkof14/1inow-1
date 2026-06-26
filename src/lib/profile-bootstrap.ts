import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ORG_RPC = "default_organization_id";
const ENSURE_ORG_RPC = "ensure_profile_organization";

function getBrowserTimezone() {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getBrowserLanguage() {
  if (typeof window === "undefined") return "en";
  return window.navigator.language?.slice(0, 2).toLowerCase() || "en";
}

function getUserFullName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown>;
  const metadataName = metadata.full_name ?? metadata.name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return user.email?.split("@")[0] ?? null;
}

function getUserAvatar(user: User) {
  const metadata = user.user_metadata as Record<string, unknown>;
  return typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;
}

export async function ensureCurrentProfile(user: User) {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id,email,organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw readError;

  if (existing) {
    const updates: { email?: string | null } = {};
    if (existing.email !== user.email) {
      updates.email = user.email ?? null;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
    }

    if (!existing.organization_id) {
      const { error } = await supabase.rpc(ENSURE_ORG_RPC, { _user_id: user.id });
      if (error) console.warn("[profile] organization bootstrap failed", error);
    }
    return;
  }

  const language = getBrowserLanguage();
  const { data: organizationId } = await supabase.rpc(DEFAULT_ORG_RPC);
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? null,
    full_name: getUserFullName(user),
    avatar_url: getUserAvatar(user),
    timezone: getBrowserTimezone(),
    language,
    preferred_language: language,
    status: "active",
    organization_id: organizationId ?? null,
  });

  if (error) throw error;

  if (!organizationId) {
    const { error: ensureError } = await supabase.rpc(ENSURE_ORG_RPC, { _user_id: user.id });
    if (ensureError) console.warn("[profile] organization bootstrap failed", ensureError);
  }
}
