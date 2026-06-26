import {
  getClientAnalyticsConfig,
  isClientAnalyticsConfigured,
  type ClientAnalyticsConfig,
} from "@/lib/analytics-public-config";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    posthog?: {
      init: (key: string, options?: Record<string, unknown>) => void;
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

function loadScript(src: string, attributes: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  for (const [key, value] of Object.entries(attributes)) {
    script.setAttribute(key, value);
  }
  document.head.appendChild(script);
}

function initPlausible(config: ClientAnalyticsConfig) {
  if (!config.plausibleDomain) return;
  loadScript("https://plausible.io/js/script.js", { "data-domain": config.plausibleDomain });
}

function initPosthog(config: ClientAnalyticsConfig) {
  if (!config.posthogKey) return;
  loadScript(`${config.posthogHost.replace(/\/$/, "")}/static/array.js`);
  window.posthog?.init(config.posthogKey, {
    api_host: config.posthogHost,
    autocapture: false,
    capture_pageview: false,
    persistence: "localStorage+cookie",
  });
}

function initGa4(config: ClientAnalyticsConfig) {
  if (!config.ga4Id) return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4Id)}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", config.ga4Id, { anonymize_ip: true });
}

export function initAnalyticsClient() {
  const config = getClientAnalyticsConfig();
  if (!isClientAnalyticsConfigured(config) || initialized) return config;

  switch (config.provider) {
    case "plausible":
      initPlausible(config);
      break;
    case "posthog":
      initPosthog(config);
      break;
    case "ga4":
      initGa4(config);
      break;
    default:
      break;
  }

  initialized = true;
  return config;
}

export function trackPageView(path: string) {
  const config = getClientAnalyticsConfig();
  if (!isClientAnalyticsConfigured(config)) return;

  switch (config.provider) {
    case "plausible":
      window.plausible?.("pageview", { props: { path } });
      break;
    case "posthog":
      window.posthog?.capture("$pageview", { $current_url: path });
      break;
    case "ga4":
      window.gtag?.("event", "page_view", { page_path: path });
      break;
    default:
      break;
  }
}

export function shutdownAnalyticsClient() {
  initialized = false;
}
