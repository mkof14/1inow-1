import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
    .select("id,email")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw readError;

  if (existing) {
    if (existing.email !== user.email) {
      const { error } = await supabase
        .from("profiles")
        .update({ email: user.email ?? null })
        .eq("id", user.id);
      if (error) throw error;
    }
    return;
  }

  const language = getBrowserLanguage();
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? null,
    full_name: getUserFullName(user),
    avatar_url: getUserAvatar(user),
    timezone: getBrowserTimezone(),
    language,
    preferred_language: language,
    status: "active",
  });

  if (error) throw error;
}
