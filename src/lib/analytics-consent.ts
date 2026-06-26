export type AnalyticsConsent = "granted" | "denied";

const STORAGE_KEY = "1inow-analytics-consent";

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === "granted" || value === "denied") return value;
  return null;
}

export function writeAnalyticsConsent(value: AnalyticsConsent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent("1inow-analytics-consent", { detail: value }));
}

export function clearAnalyticsConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("1inow-analytics-consent", { detail: null }));
}

export function subscribeAnalyticsConsent(listener: (value: AnalyticsConsent | null) => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AnalyticsConsent | null>).detail;
    listener(detail ?? readAnalyticsConsent());
  };

  window.addEventListener("1inow-analytics-consent", handler);
  return () => window.removeEventListener("1inow-analytics-consent", handler);
}
