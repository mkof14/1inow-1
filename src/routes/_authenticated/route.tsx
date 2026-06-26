import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import {
  enforceFounderModePolicy,
  isFounderModeEnabled,
  syncFounderModeWithSession,
} from "@/lib/founder-mode";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    enforceFounderModePolicy();
    if (isFounderModeEnabled()) return;

    const { data } = await supabase.auth.getSession();
    syncFounderModeWithSession(Boolean(data.session));
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
