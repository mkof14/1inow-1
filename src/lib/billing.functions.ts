import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeCheckoutSession, getBillingState } from "@/lib/billing.server";

type CheckoutInput = {
  successPath?: string;
  cancelPath?: string;
};

function resolveAppOrigin() {
  const request = getRequest();
  const origin = request?.headers.get("origin")?.trim();
  if (origin) return origin;
  return process.env.VITE_APP_URL?.trim() || "http://localhost:3000";
}

export const fetchBillingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(() => ({}))
  .handler(async () => getBillingState());

export const createBillingCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: CheckoutInput) => data ?? {})
  .handler(async ({ data, context }) => {
    const { data: userData, error: userError } = await context.supabase.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) {
      throw new Error("A verified email address is required before checkout.");
    }

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw profileError;

    let organizationId = profile?.organization_id ?? null;
    if (!organizationId) {
      const { data: orgId, error: orgError } = await context.supabase.rpc(
        "ensure_profile_organization",
        { _user_id: context.userId },
      );
      if (orgError) throw orgError;
      organizationId = orgId;
    }

    const origin = resolveAppOrigin();
    const successPath = data.successPath ?? "/settings?billing=success";
    const cancelPath = data.cancelPath ?? "/settings?billing=cancelled";

    return createStripeCheckoutSession({
      userId: context.userId,
      email: user.email,
      organizationId,
      successUrl: `${origin}${successPath}`,
      cancelUrl: `${origin}${cancelPath}`,
    });
  });
