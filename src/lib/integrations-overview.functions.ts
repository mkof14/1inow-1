import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getConnectionOverview } from "@/lib/connection-providers.server";

export const fetchIntegrationsOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => getConnectionOverview());
