import process from "node:process";

/** Synthetic user id used for founder voice audit logs when no Supabase session exists. */
export const FOUNDER_VOICE_USER_ID = "00000000-0000-4000-8000-000000000001";

export function isFounderModeEnabledOnServer() {
  return (
    process.env.VITE_ENABLE_FOUNDER_MODE === "true" ||
    process.env.ENABLE_FOUNDER_MODE === "true"
  );
}

export function isFounderVoiceBypassHeader(
  headers: Headers | Record<string, string | null | undefined>,
) {
  if (!isFounderModeEnabledOnServer()) return false;

  const value =
    headers instanceof Headers
      ? headers.get("x-1inow-founder-voice")
      : (headers["x-1inow-founder-voice"] ?? headers["X-1inow-Founder-Voice"] ?? null);

  return value === "1";
}
