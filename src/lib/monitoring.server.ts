import crypto from "node:crypto";
import process from "node:process";

export type MonitoringState = {
  enabled: boolean;
  connected: boolean;
  wired: boolean;
  status: "disabled" | "not_configured" | "ready";
  message: string;
  missingSecrets: string[];
};

export function getMonitoringState(): MonitoringState {
  const provider = (process.env.MONITORING_PROVIDER || "disabled").trim().toLowerCase();
  const enabled = provider === "sentry";
  const missingSecrets = enabled
    ? ["SENTRY_DSN", "VITE_SENTRY_DSN"].filter((name) => !process.env[name]?.trim())
    : [];
  const connected = enabled && missingSecrets.length === 0;

  return {
    enabled,
    connected,
    wired: connected,
    status: !enabled ? "disabled" : connected ? "ready" : "not_configured",
    message: !enabled
      ? "Error monitoring is disabled."
      : connected
        ? "Sentry client and server capture are wired."
        : "Sentry monitoring is enabled but DSN env vars are missing.",
    missingSecrets,
  };
}

type SentryDsnParts = {
  publicKey: string;
  projectId: string;
  host: string;
};

function parseSentryDsn(dsn: string): SentryDsnParts | null {
  try {
    const parsed = new URL(dsn);
    const publicKey = parsed.username;
    const projectId = parsed.pathname.replace(/^\//, "");
    if (!publicKey || !projectId || !parsed.host) return null;
    return { publicKey, projectId, host: parsed.host };
  } catch {
    return null;
  }
}

function stackFrames(error: Error) {
  if (!error.stack) return [];
  return error.stack
    .split("\n")
    .slice(1, 8)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/at (.+?) \((.+):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: Number(match[3]),
        };
      }
      return { function: line, filename: "unknown", lineno: 0 };
    });
}

export async function captureServerException(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const monitoring = getMonitoringState();
  if (!monitoring.connected) {
    console.error("[monitoring:disabled]", error, context);
    return;
  }

  const dsn = process.env.SENTRY_DSN!.trim();
  const parts = parseSentryDsn(dsn);
  if (!parts) {
    console.error("[monitoring:invalid-dsn]", error, context);
    return;
  }

  const normalized =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    logger: "1inow-server",
    environment: process.env.NODE_ENV || "production",
    exception: {
      values: [
        {
          type: normalized.name,
          value: normalized.message,
          stacktrace: { frames: stackFrames(normalized) },
        },
      ],
    },
    extra: context,
  };

  try {
    const response = await fetch(`https://${parts.host}/api/${parts.projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=1inow-server/1.0, sentry_key=${parts.publicKey}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error("[monitoring:upload-failed]", response.status, await response.text());
    }
  } catch (uploadError) {
    console.error("[monitoring:upload-error]", uploadError);
  }
}
