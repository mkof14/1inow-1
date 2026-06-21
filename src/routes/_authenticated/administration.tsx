import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { isFounderModeEnabled } from "@/lib/founder-mode";
import {
  LayoutDashboard, Users, Shield, Mail, ScrollText, Settings as SettingsIcon,
  FileText, Send, Mic, FlaskConical, Download,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/administration")({
  component: AdminLayout,
});

const tabs = [
  { to: "/administration",              label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { to: "/administration/users",        label: "Users",       icon: Users },
  { to: "/administration/roles",        label: "Roles & Permissions", icon: Shield },
  { to: "/administration/invitations",  label: "Invitations", icon: Mail },
  { to: "/administration/emails",       label: "Email Templates", icon: FileText },
  { to: "/administration/email-logs",   label: "Email Logs",  icon: Send },
  { to: "/administration/voice",        label: "Voice Controls", icon: Mic },
  { to: "/administration/audit",        label: "Audit Logs",  icon: ScrollText },
  { to: "/administration/settings",     label: "Settings",    icon: SettingsIcon },
  { to: "/administration/role-switcher", label: "Role Switcher", icon: FlaskConical },
  { to: "/administration/downloads",    label: "Downloads",   icon: Download },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visibleTabs = isFounderModeEnabled()
    ? tabs
    : tabs.filter((tab) => tab.to !== "/administration/role-switcher");

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)]">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/20 p-3">
        <div className="px-2 pb-3">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admin</div>
          <div className="text-sm font-semibold mt-0.5">Control Center</div>
        </div>
        <nav className="space-y-0.5">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
