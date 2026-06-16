import { type ReactNode, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { navGroups } from "@/lib/nav-config";
import { useAuth } from "@/hooks/use-auth";
import { Search, Bell, LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { fetchFavorites, fetchRecent, fetchNotifications } from "@/lib/wave1";
import { QuickCreate } from "@/components/quick-create";
import { CommandBar } from "@/components/command-bar";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n";
import {
  CompassLogo, CompassMark, DirectionArrow, GearMark, HelpMark,
} from "@/components/icons/compass-icons";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [dark, setDark] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(0);

  useShortcuts(() => setCmdOpen(true), () => setQuickOpen((n) => n + 1));

  const { data: favorites = [] } = useQuery({ queryKey: ["favorites"], queryFn: fetchFavorites, enabled: !!user });
  const { data: recent = [] } = useQuery({ queryKey: ["recent"], queryFn: () => fetchRecent(5), enabled: !!user });
  const { data: notifs = [] } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, enabled: !!user });
  const unread = notifs.filter((n) => !n.read_at).length;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(/\s|@/)[0].slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <span className="text-primary"><CompassLogo size={28} /></span>
          <div className="leading-tight">
            <div className="font-display text-base text-sidebar-foreground">Digital Invest</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Compass</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pt-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                {t(`nav.${group.label}`, group.label)}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-all",
                        active
                          ? "nav-rail-active font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className={cn("size-4 transition-colors", active && "text-accent")} />
                      <span className="flex-1">{t(`nav.${item.label}`, item.label)}</span>
                      {item.to === "/inbox" && unread > 0 && (
                        <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">{unread}</Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {favorites.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{t("nav.Favorites_section", "Favorites")}</div>
              <div className="space-y-0.5">
                {favorites.slice(0, 6).map((f) => (
                  <Link
                    key={f.id}
                    to={f.entity_type === "project" ? "/projects" : "/tasks"}
                    className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <CompassMark className="size-3.5 text-accent" />
                    <span className="truncate">{f.label ?? f.entity_type}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{t("nav.Recent", "Recent")}</div>
              <div className="space-y-0.5">
                {recent.slice(0, 5).map((r) => (
                  <Link
                    key={r.id}
                    to={r.entity_type === "project" ? "/projects" : "/tasks"}
                    className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <DirectionArrow className="size-3.5" />
                    <span className="truncate">{r.label ?? r.entity_type}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom block: language + settings + help */}
        <div className="border-t border-sidebar-border px-2.5 py-2.5 space-y-0.5">
          <Link
            to="/settings"
            className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <GearMark className="size-4" />
            <span className="flex-1">{t("nav.Settings", "Settings")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="w-full flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <HelpMark className="size-4" />
            <span className="flex-1 text-left">{t("nav.Help", "Help")}</span>
            <kbd className="text-[9px] font-mono text-muted-foreground">⌘K</kbd>
          </button>
          <div className="px-2 pt-1.5"><LanguageSwitcher compact /></div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-background/70 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 max-w-md flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                data-global-search
                className="w-full text-left bg-muted/50 border border-transparent hover:border-border rounded-md pl-8 pr-12 py-1.5 text-[13px] text-muted-foreground transition-colors"
              >
                {t("search.placeholder")}
              </button>
              <input type="hidden" />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground">⌘K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate({ to: "/inbox" })}>
              <Bell className="size-4" />
              {unread > 0 && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent signal-pulse" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 ml-2 rounded-full hover:bg-muted px-1.5 py-1 transition-colors">
                  <div className="size-8 rounded-full gradient-compass text-primary-foreground grid place-items-center text-xs font-semibold">
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  {t("common.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/auth" });
                  }}
                  className="text-destructive"
                >
                  <LogOut className="size-4 mr-2" /> {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
        <QuickCreate openSignal={quickOpen} />
        <CommandBar open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </div>
  );
}