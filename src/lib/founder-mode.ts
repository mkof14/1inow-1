const FOUNDER_SESSION_KEY = "1inow_founder_session";

function isLocalHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export function isFounderAccessAvailable() {
  if (import.meta.env.VITE_ENABLE_FOUNDER_MODE === "true") return true;
  return import.meta.env.DEV || isLocalHost();
}

export function isFounderModeEnabled() {
  if (!isFounderAccessAvailable()) return false;

  if (typeof window === "undefined") return import.meta.env.VITE_ENABLE_FOUNDER_MODE === "true";

  return window.localStorage.getItem(FOUNDER_SESSION_KEY) === "true";
}

export function enableFounderMode() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOUNDER_SESSION_KEY, "true");
}

export function disableFounderMode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FOUNDER_SESSION_KEY);
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
