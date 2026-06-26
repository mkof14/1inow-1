import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { initAnalyticsClient, trackPageView } from "@/lib/analytics-client";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";
import { isClientAnalyticsConfigured } from "@/lib/analytics-public-config";

function maybeStartAnalytics(consent: AnalyticsConsent | null) {
  if (consent !== "granted" || !isClientAnalyticsConfigured()) return;
  initAnalyticsClient();
  trackPageView(window.location.pathname);
}

export function AnalyticsRuntime() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    maybeStartAnalytics(readAnalyticsConsent());
    return subscribeAnalyticsConsent((consent) => {
      maybeStartAnalytics(consent);
    });
  }, []);

  useEffect(() => {
    if (readAnalyticsConsent() !== "granted") return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
