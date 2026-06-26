import { createFileRoute } from "@tanstack/react-router";
import {
  getBillingState,
  handleStripeWebhookEvent,
  verifyStripeWebhookSignature,
  type StripeWebhookEvent,
} from "@/lib/billing.server";
import { captureServerException } from "@/lib/monitoring.server";

export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const billing = getBillingState();
          if (!billing.connected) {
            return Response.json({ error: billing.message }, { status: 503 });
          }

          const payload = await request.text();
          const signature = request.headers.get("stripe-signature");

          if (!verifyStripeWebhookSignature(payload, signature)) {
            return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
          }

          let event: StripeWebhookEvent;
          try {
            event = JSON.parse(payload) as StripeWebhookEvent;
          } catch {
            return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
          }

          switch (event.type) {
            case "checkout.session.completed":
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
            case "invoice.payment_failed":
              await handleStripeWebhookEvent(event);
              break;
            default:
              break;
          }

          return Response.json({ received: true });
        } catch (error) {
          await captureServerException(error, { route: "/api/stripe-webhook" });
          return Response.json({ error: "Webhook handler failed" }, { status: 500 });
        }
      },
    },
  },
});
