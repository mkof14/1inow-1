import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function hasOAuthCallbackInUrl() {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  return (
    search.includes("code=") ||
    search.includes("error=") ||
    hash.includes("access_token=") ||
    hash.includes("error=")
  );
}

/** Wait for Supabase to finish PKCE / hash OAuth exchange before route guards run. */
export async function resolveAuthSession(options?: { timeoutMs?: number }) {
  const timeoutMs = options?.timeoutMs ?? 8000;
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
