const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export type GoogleOAuthStatus =
  | { ready: true }
  | { ready: false; reason: "disabled" | "misconfigured" | "redirect" | "unknown"; message: string };

export function formatGoogleAuthError(message: string) {
  if (/missing OAuth secret/i.test(message)) {
    return "Вход через Google сейчас недоступен. Попробуйте email или Founder.";
  }
  if (/redirect_uri_mismatch/i.test(message)) {
    return "Ошибка Google OAuth. Попробуйте другой способ входа.";
  }
  return message;
}

/** Probe Supabase authorize endpoint — catches missing client secret before redirect. */
export async function probeGoogleOAuthReady(redirectTo: string): Promise<GoogleOAuthStatus> {
  if (import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== "true") {
    return { ready: false, reason: "disabled", message: "Google sign-in is disabled for this build." };
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ready: false, reason: "misconfigured", message: "Supabase env is missing on this build." };
  }

  try {
    const url = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
    url.searchParams.set("provider", "google");
    url.searchParams.set("redirect_to", redirectTo);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { apikey: SUPABASE_KEY },
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") ?? "";
      if (location.includes("accounts.google.com")) {
        return { ready: true };
      }
      return {
        ready: false,
        reason: "unknown",
        message: "Google OAuth returned an unexpected redirect.",
      };
    }

    const body = await response.text();
    let msg = body;
    try {
      const parsed = JSON.parse(body) as { msg?: string; error_description?: string };
      msg = parsed.msg ?? parsed.error_description ?? body;
    } catch {
      // keep raw body
    }

    if (/missing OAuth secret/i.test(msg)) {
      return {
        ready: false,
        reason: "misconfigured",
        message: formatGoogleAuthError(msg),
      };
    }

    return { ready: false, reason: "unknown", message: formatGoogleAuthError(msg) };
  } catch (error) {
    return {
      ready: false,
      reason: "unknown",
      message: error instanceof Error ? error.message : "Could not verify Google OAuth.",
    };
  }
}
