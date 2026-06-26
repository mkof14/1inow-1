import { useEffect } from "react";
import { bindGlobalClientErrorHandlers, initMonitoringClient } from "@/lib/monitoring-client";
import { isClientMonitoringConfigured } from "@/lib/monitoring-public-config";

export function MonitoringRuntime() {
  useEffect(() => {
    if (!isClientMonitoringConfigured()) return;
    void initMonitoringClient();
    return bindGlobalClientErrorHandlers();
  }, []);

  return null;
}
