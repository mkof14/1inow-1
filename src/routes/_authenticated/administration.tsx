import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROUTE_PERMISSIONS,
  requireAdminAreaSession,
  resolveAdminAreaAccess,
} from "@/lib/auth-roles";
import { isDevOwnerToolsAvailable } from "@/lib/dev-owner-tools";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Shield,
  Mail,
  ScrollText,
  Settings as SettingsIcon,
  FileText,
  Send,
  Mic,
  FlaskConical,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/administration")({
  beforeLoad: async () => {
    const gate = await requireAdminAreaSession();
    if (!gate.allowed) {
      throw redirect({ to: gate.reason === "no_session" ? "/auth" : "/dashboard" });
    }
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/administration", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/administration/users", label: "Users", icon: Users },
  { to: "/administration/roles", label: "Roles & Permissions", icon: Shield },
  { to: "/administration/invitations", label: "Invitations", icon: Mail },
  { to: "/administration/emails", label: "Email Templates", icon: FileText },
  { to: "/administration/email-logs", label: "Email Logs", icon: Send },
  { to: "/administration/voice", label: "Voice Controls", icon: Mic },
  { to: "/administration/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/administration/settings", label: "Settings", icon: SettingsIcon },
  { to: "/administration/role-switcher", label: "Role Switcher", icon: FlaskConical },
  { to: "/administration/downloads", label: "Downloads", icon: Download },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const access = useQuery({
    queryKey: ["admin-area-access", user?.id],
    queryFn: () => resolveAdminAreaAccess(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (!access.data) return;

    const requiredPermission = ADMIN_ROUTE_PERMISSIONS[pathname];
    if (requiredPermission && !access.data.permissions[requiredPermission]) {
      void navigate({ to: "/administration", replace: true });
    }
  }, [access.data, navigate, pathname]);

  const visibleTabs = tabs.filter((tab) => {
    if (tab.to === "/administration/role-switcher" && !isDevOwnerToolsAvailable()) {
      return false;
    }

    const requiredPermission = ADMIN_ROUTE_PERMISSIONS[tab.to];
    if (!requiredPermission) return true;
    return access.data?.permissions[requiredPermission] ?? false;
  });

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)]">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/20 p-3">
        <div className="px-2 pb-3">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </div>
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
