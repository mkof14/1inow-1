export type ClientMonitoringProvider = "disabled" | "sentry";

const PROVIDERS: ClientMonitoringProvider[] = ["disabled", "sentry"];

function normalizeProvider(value: string | undefined): ClientMonitoringProvider {
  const normalized = value?.trim().toLowerCase();
  return PROVIDERS.includes(normalized as ClientMonitoringProvider)
    ? (normalized as ClientMonitoringProvider)
    : "disabled";
}

export function getClientMonitoringConfig() {
  const provider = normalizeProvider(
    import.meta.env.VITE_MONITORING_PROVIDER || import.meta.env.MONITORING_PROVIDER,
  );
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim() || "";

  return {
    provider,
    enabled: provider === "sentry" && !!dsn,
    dsn,
    environment: import.meta.env.MODE || "production",
  };
}

export function isClientMonitoringConfigured(config = getClientMonitoringConfig()) {
  return config.enabled;
}
