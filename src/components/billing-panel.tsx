import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBillingCheckoutSession, fetchBillingStatus } from "@/lib/billing.functions";

export function BillingPanel() {
  const loadStatus = useServerFn(fetchBillingStatus);
  const startCheckout = useServerFn(createBillingCheckoutSession);
  const status = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => loadStatus({ data: {} }),
  });

  const checkout = useMutation({
    mutationFn: async () => startCheckout({ data: {} }),
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const billing = status.data;
  if (!billing || billing.status === "disabled") {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Workspace billing is not enabled in this environment.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <CreditCard className="size-4 text-accent" />
            Workspace billing
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{billing.message}</p>
        </div>
        <Badge variant={billing.connected ? "default" : "secondary"}>{billing.status}</Badge>
      </div>

      {billing.connected ? (
        <Button disabled={checkout.isPending} onClick={() => checkout.mutate()}>
          {checkout.isPending ? "Opening checkout..." : "Manage subscription"}
          <ExternalLink className="ml-2 size-4" />
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Missing secrets: {billing.missingSecrets.join(", ") || "none listed"}
        </p>
      )}
    </div>
  );
}
