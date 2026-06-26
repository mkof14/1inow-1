import process from "node:process";
import { getInvitationEmailState } from "@/lib/email-delivery.server";

export type AiProvider = "disabled" | "openai" | "anthropic" | "gemini" | "internal";
export type SpeechProvider = "disabled" | "browser" | "openai" | "google" | "azure";
export type VoiceProvider = "disabled" | "browser" | "openai" | "elevenlabs" | "azure";
export type BillingProvider = "disabled" | "stripe";
export type AnalyticsProvider = "disabled" | "plausible" | "posthog" | "ga4";
export type MonitoringProvider = "disabled" | "sentry";

export type ConnectionCapability =
  | "chat"
  | "stt"
  | "tts"
  | "voice-commands"
  | "model-router"
  | "audit"
  | "email"
  | "billing"
  | "analytics"
  | "monitoring";

export type ProviderState = {
  service: "chat" | "stt" | "tts";
  provider: AiProvider | SpeechProvider | VoiceProvider;
  disabled: boolean;
  connected: boolean;
  status: "disabled" | "browser_only" | "not_configured" | "ready";
  message: string;
  capabilities: ConnectionCapability[];
  missingSecrets: string[];
  nextStep: string;
};

export type IntegrationState = {
  service: "email" | "billing" | "analytics" | "monitoring";
  provider: string;
  disabled: boolean;
  connected: boolean;
  status: "disabled" | "not_configured" | "ready";
  message: string;
  missingSecrets: string[];
  nextStep: string;
};

const AI_PROVIDERS: AiProvider[] = ["disabled", "openai", "anthropic", "gemini", "internal"];
const STT_PROVIDERS: SpeechProvider[] = ["disabled", "browser", "openai", "google", "azure"];
const TTS_PROVIDERS: VoiceProvider[] = ["disabled", "browser", "openai", "elevenlabs", "azure"];

const AI_SECRET_BY_PROVIDER: Partial<Record<AiProvider, string[]>> = {
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  gemini: ["GEMINI_API_KEY"],
  internal: ["INTERNAL_AI_GATEWAY_URL", "INTERNAL_AI_GATEWAY_TOKEN"],
};

const STT_SECRET_BY_PROVIDER: Partial<Record<SpeechProvider, string[]>> = {
  openai: ["OPENAI_API_KEY"],
  google: ["GOOGLE_SPEECH_API_KEY"],
  azure: ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
};

const TTS_SECRET_BY_PROVIDER: Partial<Record<VoiceProvider, string[]>> = {
  openai: ["OPENAI_API_KEY"],
  elevenlabs: ["ELEVENLABS_API_KEY"],
  azure: ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
};

const BILLING_PROVIDERS: BillingProvider[] = ["disabled", "stripe"];
const ANALYTICS_PROVIDERS: AnalyticsProvider[] = ["disabled", "plausible", "posthog", "ga4"];
const MONITORING_PROVIDERS: MonitoringProvider[] = ["disabled", "sentry"];

const ANALYTICS_SECRET_BY_PROVIDER: Partial<Record<AnalyticsProvider, string[]>> = {
  plausible: ["PLAUSIBLE_DOMAIN"],
  posthog: ["POSTHOG_API_KEY", "POSTHOG_HOST"],
  ga4: ["VITE_GA4_MEASUREMENT_ID"],
};

export function getConnectionOverview() {
  return {
    chat: getChatProviderState(),
    stt: getSttProviderState(),
    tts: getTtsProviderState(),
    email: getEmailIntegrationState(),
    billing: getBillingIntegrationState(),
    analytics: getAnalyticsIntegrationState(),
    monitoring: getMonitoringIntegrationState(),
    modelRouterEnabled: process.env.AI_MODEL_ROUTER_ENABLED === "true",
    auditLoggingEnabled: process.env.AI_AUDIT_LOGGING_ENABLED !== "false",
  };
}

export function getChatProviderState(): ProviderState {
  const provider = normalizeProvider(process.env.AI_PROVIDER, AI_PROVIDERS, "disabled");
  const missingSecrets = getMissingSecrets(AI_SECRET_BY_PROVIDER[provider] ?? []);
  const ready = provider !== "disabled" && missingSecrets.length === 0;

  return {
    service: "chat",
    provider,
    disabled: !ready,
    connected: ready,
    status: provider === "disabled" ? "disabled" : ready ? "ready" : "not_configured",
    message: ready
      ? `AI provider ${provider} is configured but not wired to runtime calls yet.`
      : "AI service is not connected yet.",
    capabilities: ["chat", "model-router", "audit"],
    missingSecrets,
    nextStep: ready
      ? "Implement provider adapter call and response audit logging."
      : "Choose an AI provider and add secrets only in Vercel or local private env.",
  };
}

export function getSttProviderState(): ProviderState {
  const provider = normalizeProvider(process.env.STT_PROVIDER, STT_PROVIDERS, "browser");
  const missingSecrets = getMissingSecrets(STT_SECRET_BY_PROVIDER[provider] ?? []);
  const browserOnly = provider === "browser";
  const ready = provider !== "disabled" && !browserOnly && missingSecrets.length === 0;

  return {
    service: "stt",
    provider,
    disabled: !ready,
    connected: ready,
    status:
      provider === "disabled"
        ? "disabled"
        : browserOnly
          ? "browser_only"
          : ready
            ? "ready"
            : "not_configured",
    message: browserOnly
      ? "Server speech-to-text is not connected yet. Browser speech recognition can be used on supported devices."
      : ready
        ? `Speech-to-text provider ${provider} is configured but not wired to runtime calls yet.`
        : "Speech-to-text service is not connected yet.",
    capabilities: ["stt", "voice-commands", "audit"],
    missingSecrets,
    nextStep: browserOnly
      ? "Keep browser recognition for lightweight commands or approve a server STT provider."
      : "Implement the selected STT adapter after provider approval.",
  };
}

export function getTtsProviderState(): ProviderState {
  const provider = normalizeProvider(process.env.TTS_PROVIDER, TTS_PROVIDERS, "disabled");
  const missingSecrets = getMissingSecrets(TTS_SECRET_BY_PROVIDER[provider] ?? []);
  const browserOnly = provider === "browser";
  const ready = provider !== "disabled" && !browserOnly && missingSecrets.length === 0;

  return {
    service: "tts",
    provider,
    disabled: !ready,
    connected: ready,
    status:
      provider === "disabled"
        ? "disabled"
        : browserOnly
          ? "browser_only"
          : ready
            ? "ready"
            : "not_configured",
    message: browserOnly
      ? "Server text-to-speech is not connected yet. Browser speech synthesis can be used on supported devices."
      : ready
        ? `Text-to-speech provider ${provider} is configured but not wired to runtime calls yet.`
        : "Text-to-speech service is not connected yet.",
    capabilities: ["tts", "voice-commands", "audit"],
    missingSecrets,
    nextStep: browserOnly
      ? "Use browser synthesis for local playback or approve a server TTS provider."
      : "Implement the selected TTS adapter after provider approval.",
  };
}

export function getEmailIntegrationState(): IntegrationState {
  const email = getInvitationEmailState();

  return {
    service: "email",
    provider: "resend",
    disabled: !email.connected,
    connected: email.connected,
    status: email.status,
    message: email.message,
    missingSecrets: email.missingSecrets,
    nextStep: email.connected
      ? "Invitation create/resend will deliver through Resend."
      : "Enable ENABLE_INVITATION_EMAIL and configure Resend secrets.",
  };
}

export function getBillingIntegrationState(): IntegrationState {
  const enabled = process.env.ENABLE_STRIPE === "true";
  const provider: BillingProvider = enabled
    ? normalizeProvider(process.env.BILLING_PROVIDER, BILLING_PROVIDERS, "stripe")
    : "disabled";
  const missingSecrets = enabled
    ? getMissingSecrets([
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "VITE_STRIPE_PUBLISHABLE_KEY",
      ])
    : [];

  const connected = enabled && provider !== "disabled" && missingSecrets.length === 0;

  return {
    service: "billing",
    provider,
    disabled: !enabled,
    connected,
    status: !enabled ? "disabled" : connected ? "ready" : "not_configured",
    message: !enabled
      ? "Stripe billing is disabled. No checkout or subscription calls are made."
      : connected
        ? "Stripe secrets are present but checkout/webhooks are not wired yet."
        : "Stripe is enabled but required secrets are missing.",
    missingSecrets,
    nextStep: connected
      ? "Implement checkout session + webhook handler in a dedicated billing task."
      : "Set ENABLE_STRIPE=true and add Stripe keys only after billing scope is approved.",
  };
}

export function getAnalyticsIntegrationState(): IntegrationState {
  const provider = normalizeProvider(
    process.env.ANALYTICS_PROVIDER,
    ANALYTICS_PROVIDERS,
    "disabled",
  );
  const missingSecrets = getMissingSecrets(ANALYTICS_SECRET_BY_PROVIDER[provider] ?? []);
  const connected = provider !== "disabled" && missingSecrets.length === 0;

  return {
    service: "analytics",
    provider,
    disabled: provider === "disabled",
    connected,
    status: provider === "disabled" ? "disabled" : connected ? "ready" : "not_configured",
    message:
      provider === "disabled"
        ? "Analytics beacons are disabled."
        : connected
          ? `${provider} is configured but client beacons are not wired yet.`
          : `${provider} selected but required env vars are missing.`,
    missingSecrets,
    nextStep:
      provider === "disabled"
        ? "Complete privacy review before enabling analytics."
        : "Add consent UX and provider snippet in a dedicated analytics task.",
  };
}

export function getMonitoringIntegrationState(): IntegrationState {
  const provider = normalizeProvider(
    process.env.MONITORING_PROVIDER,
    MONITORING_PROVIDERS,
    "disabled",
  );
  const missingSecrets = provider === "sentry" ? getMissingSecrets(["SENTRY_DSN"]) : [];
  const connected = provider !== "disabled" && missingSecrets.length === 0;

  return {
    service: "monitoring",
    provider,
    disabled: provider === "disabled",
    connected,
    status: provider === "disabled" ? "disabled" : connected ? "ready" : "not_configured",
    message:
      provider === "disabled"
        ? "Error monitoring is disabled."
        : connected
          ? "Sentry DSN is configured but SDK capture is not wired yet."
          : "Monitoring provider selected but SENTRY_DSN is missing.",
    missingSecrets,
    nextStep: connected
      ? "Wire Sentry in client + server error boundaries."
      : "Choose monitoring provider after on-call process is defined.",
  };
}

function normalizeProvider<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const normalized = value?.trim().toLowerCase();
  return allowed.includes(normalized as T) ? (normalized as T) : fallback;
}

function getMissingSecrets(secretNames: string[]) {
  return secretNames.filter((name) => !process.env[name]?.trim());
}
