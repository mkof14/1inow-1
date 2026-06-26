import {
  getClientMonitoringConfig,
  isClientMonitoringConfigured,
} from "@/lib/monitoring-public-config";

declare global {
  interface Window {
    Sentry?: {
      init: (options: Record<string, unknown>) => void;
      captureException: (error: unknown, context?: { extra?: Record<string, unknown> }) => void;
    };
  }
}

let initialized = false;
const SENTRY_BUNDLE = "https://browser.sentry-cdn.com/8.55.0/bundle.min.js";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export async function initMonitoringClient() {
  const config = getClientMonitoringConfig();
  if (!isClientMonitoringConfigured(config) || initialized) return;

  try {
    await loadScript(SENTRY_BUNDLE);
    window.Sentry?.init({
      dsn: config.dsn,
      environment: config.environment,
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
    initialized = true;
  } catch (error) {
    console.error("[monitoring:init-failed]", error);
  }
}

export function captureClientException(error: unknown, context: Record<string, unknown> = {}) {
  if (initialized && window.Sentry?.captureException) {
    window.Sentry.captureException(error, { extra: context });
    return;
  }
  console.error("[client-error]", error, context);
}

export function bindGlobalClientErrorHandlers() {
  if (typeof window === "undefined") return () => undefined;

  const onError = (event: ErrorEvent) => {
    captureClientException(event.error ?? event.message, { boundary: "window.error" });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    captureClientException(event.reason, { boundary: "window.unhandledrejection" });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
