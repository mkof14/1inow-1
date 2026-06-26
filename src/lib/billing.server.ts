import crypto from "node:crypto";
import process from "node:process";

export type BillingState = {
  enabled: boolean;
  connected: boolean;
  wired: boolean;
  status: "disabled" | "not_configured" | "ready";
  message: string;
  missingSecrets: string[];
};

const REQUIRED_SECRETS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "VITE_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_ID",
] as const;

export function getBillingState(): BillingState {
  const enabled = process.env.ENABLE_STRIPE === "true";
  const missingSecrets = enabled ? getMissingSecrets([...REQUIRED_SECRETS]) : [];
  const connected = enabled && missingSecrets.length === 0;

  return {
    enabled,
    connected,
    wired: connected,
    status: !enabled ? "disabled" : connected ? "ready" : "not_configured",
    message: !enabled
      ? "Stripe billing is disabled. No checkout or subscription calls are made."
      : connected
        ? "Stripe checkout and webhook handlers are wired."
        : "Stripe is enabled but required secrets are missing.",
    missingSecrets,
  };
}

export async function createStripeCheckoutSession(input: {
  userId: string;
  email: string;
  organizationId?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const state = getBillingState();
  if (!state.connected) {
    throw new Error(state.message);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY!;
  const priceId = process.env.STRIPE_PRICE_ID!;

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", input.successUrl);
  body.set("cancel_url", input.cancelUrl);
  body.set("client_reference_id", input.userId);
  body.set("customer_email", input.email);
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[user_id]", input.userId);
  if (input.organizationId) {
    body.set("metadata[organization_id]", input.organizationId);
  }
  body.set("allow_promotion_codes", "true");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Stripe checkout error (${response.status}): ${detail || response.statusText}`);
  }

  const payload = (await response.json()) as { url?: string | null; id?: string };
  if (!payload.url) {
    throw new Error("Stripe checkout session did not return a redirect URL.");
  }

  return { url: payload.url, sessionId: payload.id ?? null };
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",").map((part) => part.trim());
  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((signature) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

export async function handleStripeWebhookEvent(event: StripeWebhookEvent) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const object = event.data.object;
  const metadata = (object.metadata as Record<string, string> | undefined) ?? {};
  const userId =
    metadata.user_id ??
    (typeof object.client_reference_id === "string" ? object.client_reference_id : null);
  const organizationId = metadata.organization_id ?? null;

  const auditRow = {
    actor_id: userId,
    organization_id: organizationId,
    action: `stripe.${event.type}`,
    entity_type: "billing",
    entity_id: typeof object.id === "string" ? object.id : event.id,
    severity: "info",
    module: "billing",
    metadata: {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      customer: object.customer ?? null,
      subscription: object.subscription ?? null,
    },
  };

  const { error } = await supabaseAdmin.from("audit_logs").insert(auditRow as never);
  if (error) {
    console.error("[Stripe webhook] audit log insert failed:", error.message);
  }

  return { ok: true as const, userId, eventType: event.type };
}

function getMissingSecrets(secretNames: string[]) {
  return secretNames.filter((name) => !process.env[name]?.trim());
}
