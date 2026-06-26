export type ClientAnalyticsProvider = "disabled" | "plausible" | "posthog" | "ga4";

export type ClientAnalyticsConfig = {
  provider: ClientAnalyticsProvider;
  enabled: boolean;
  plausibleDomain: string;
  posthogKey: string;
  posthogHost: string;
  ga4Id: string;
};

const PROVIDERS: ClientAnalyticsProvider[] = ["disabled", "plausible", "posthog", "ga4"];

function normalizeProvider(value: string | undefined): ClientAnalyticsProvider {
  const normalized = value?.trim().toLowerCase();
  return PROVIDERS.includes(normalized as ClientAnalyticsProvider)
    ? (normalized as ClientAnalyticsProvider)
    : "disabled";
}

export function getClientAnalyticsConfig(): ClientAnalyticsConfig {
  const provider = normalizeProvider(
    import.meta.env.VITE_ANALYTICS_PROVIDER || import.meta.env.ANALYTICS_PROVIDER,
  );

  return {
    provider,
    enabled: provider !== "disabled",
    plausibleDomain: import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() || "",
    posthogKey: import.meta.env.VITE_POSTHOG_KEY?.trim() || "",
    posthogHost: import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    ga4Id: import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || "",
  };
}

export function isClientAnalyticsConfigured(config = getClientAnalyticsConfig()) {
  if (!config.enabled) return false;
  switch (config.provider) {
    case "plausible":
      return !!config.plausibleDomain;
    case "posthog":
      return !!config.posthogKey && !!config.posthogHost;
    case "ga4":
      return !!config.ga4Id;
    default:
      return false;
  }
}
