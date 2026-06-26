import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getClientAnalyticsConfig,
  isClientAnalyticsConfigured,
} from "@/lib/analytics-public-config";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  writeAnalyticsConsent,
} from "@/lib/analytics-consent";

export function AnalyticsConsentBanner() {
  const config = getClientAnalyticsConfig();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isClientAnalyticsConfigured()) return;
    setVisible(readAnalyticsConsent() === null);
    return subscribeAnalyticsConsent((value) => {
      setVisible(value === null);
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          We use privacy-conscious analytics to understand product usage. You can accept or decline
          optional analytics cookies. See our{" "}
          <Link to="/legal/privacy" className="text-foreground underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => writeAnalyticsConsent("denied")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => writeAnalyticsConsent("granted")}>
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
