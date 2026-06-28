import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function hasOAuthCallbackInUrl() {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  return (
    search.includes("code=") ||
    search.includes("error=") ||
    hash.includes("access_token=") ||
    hash.includes("error=")
  );
}

export function readOAuthCallbackError() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const raw =
    params.get("error_description") ||
    params.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error");
  if (!raw) return null;
  return decodeURIComponent(raw.replace(/\+/g, " "));
}

export function clearOAuthCallbackFromUrl(preserveQuery?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(preserveQuery ?? {})) {
    if (value) next.set(key, value);
  }
  const suffix = next.toString();
  window.history.replaceState({}, "", suffix ? `/auth?${suffix}` : "/auth");
}

/** Wait for Supabase to finish PKCE / hash OAuth exchange before route guards run. */
export async function resolveAuthSession(options?: { timeoutMs?: number }) {
  const timeoutMs = options?.timeoutMs ?? 8000;

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session;

    if (!hasOAuthCallbackInUrl()) break;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

export function subscribeToAuthSession(onSession: (session: Session | null) => void) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    onSession(session);
  });

  void resolveAuthSession().then(onSession);

  return () => sub.subscription.unsubscribe();
}
