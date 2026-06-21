export function isFounderModeEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_FOUNDER_MODE === "true";
}
