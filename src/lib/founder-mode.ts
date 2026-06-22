export function isFounderModeEnabled() {
  if (!import.meta.env.DEV) return false;
  if (import.meta.env.VITE_ENABLE_FOUNDER_MODE === "true") return true;

  if (typeof window === "undefined") return true;

  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export const FOUNDER_EMAIL = "dnainform@gmail.com";

export const FOUNDER_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: FOUNDER_EMAIL,
  user_metadata: {
    full_name: "Michael Kofman",
    role: "super_admin",
  },
};
