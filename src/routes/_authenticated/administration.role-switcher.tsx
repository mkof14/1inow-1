import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, ShieldCheck, Briefcase, User } from "lucide-react";
import { setSelfRole } from "@/lib/api/dev-tools.functions";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/administration/role-switcher")({
  component: RoleSwitcherPage,
});

const OPTIONS = [
  { role: "super_admin", label: "Super Admin", icon: ShieldCheck, hint: "Full control — every page and action." },
  { role: "admin",       label: "Admin",       icon: Shield,      hint: "Manages users, content, settings." },
  { role: "project_manager", label: "Manager", icon: Briefcase,   hint: "Plans projects, assigns tasks." },
  { role: "employee",    label: "Member",      icon: User,        hint: "Standard team member access." },
] as const;

function RoleSwitcherPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  // Load current role once
  if (current === null && user?.id) {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setCurrent((data?.role as string) ?? "—"));
  }

  const apply = async (role: (typeof OPTIONS)[number]["role"]) => {
    setBusy(role);
    try {
      await setSelfRole({ data: { role } });
      setCurrent(role);
      await qc.invalidateQueries();
      toast.success(`Now acting as ${role.replace("_", " ")}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to switch role");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Role Switcher</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dev-only. Instantly switch your own role to test access. Current role:{" "}
          <span className="font-mono text-foreground">{current ?? "…"}</span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = current === o.role;
          return (
            <Card
              key={o.role}
              className={`p-4 flex items-start gap-3 ${active ? "ring-1 ring-accent/60" : ""}`}
            >
              <Icon className="size-5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{o.label}</div>
                  {active && <span className="text-[10px] uppercase tracking-wider text-accent">current</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{o.hint}</div>
                <Button
                  size="sm"
                  variant={active ? "secondary" : "default"}
                  disabled={busy !== null || active}
                  className="mt-3"
                  onClick={() => apply(o.role)}
                >
                  {busy === o.role ? "Switching…" : active ? "Active" : "Switch"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        After switching, the sidebar and protected pages update immediately. To return to full access, pick Super Admin again.
      </p>
    </div>
  );
}