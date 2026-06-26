import { captureClientException } from "@/lib/monitoring-client";
import { isClientMonitoringConfigured } from "@/lib/monitoring-public-config";

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  if (isClientMonitoringConfigured()) {
    captureClientException(error, context);
    return;
  }

  console.error("Client error", { error, ...context });
}
