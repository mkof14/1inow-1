import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearAnalyticsConsent,
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";
import {
  getClientAnalyticsConfig,
  isClientAnalyticsConfigured,
} from "@/lib/analytics-public-config";

export function AnalyticsPrivacyPanel() {
  const config = getClientAnalyticsConfig();
  const configured = isClientAnalyticsConfigured(config);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    setConsent(readAnalyticsConsent());
    return subscribeAnalyticsConsent(setConsent);
  }, []);

  if (!configured) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Analytics beacons are disabled in this environment.
      </div>
    );
  }

  const label =
    consent === "granted" ? "Accepted" : consent === "denied" ? "Declined" : "Not chosen";

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">Analytics & privacy</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Provider: {config.provider}. Optional analytics load only after consent. Read the{" "}
            <Link to="/legal/privacy" className="text-foreground underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <Badge variant={consent === "granted" ? "default" : "secondary"}>{label}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => writeAnalyticsConsent("granted")}>
          Accept analytics
        </Button>
        <Button size="sm" variant="outline" onClick={() => writeAnalyticsConsent("denied")}>
          Decline analytics
        </Button>
        <Button size="sm" variant="ghost" onClick={() => clearAnalyticsConsent()}>
          Reset choice
        </Button>
      </div>
    </div>
  );
}
