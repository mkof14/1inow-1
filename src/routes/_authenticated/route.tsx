import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { resolveAuthSession } from "@/lib/auth-session";
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

    const session = await resolveAuthSession();
    syncFounderModeWithSession(Boolean(session));
    if (!session) {
      throw redirect({ to: "/auth" });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      await supabase.auth.signOut();
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
