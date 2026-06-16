import { type ReactNode, useState, useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { primaryNav, moreNav } from "@/lib/nav-config";
import { useAuth } from "@/hooks/use-auth";
import { Search, Bell, LogOut, Moon, Sun, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/wave1";
import { QuickCreate } from "@/components/quick-create";
import { CommandBar } from "@/components/command-bar";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n";
import { CompassLogo } from "@/components/icons/compass-icons";
import { Fab } from "@/components/fab";
import { AiSidebar, CollapsedRail, type AiSidebarMode } from "@/components/ai-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut, isAdmin } = useAuth() as any;
  const navigate = useNavigate();
  const t = useT();
  const [dark, setDark] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(0);
  const [aiOpen, setAiOpen] = useState(true);
  const [aiMode, setAiMode] = useState<AiSidebarMode>("docked");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAiOpen((v) => !v);
      } else if (e.code === "Space" && !inField && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setAiOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useShortcuts(() => setCmdOpen(true), () => setQuickOpen((n) => n + 1));

  const { data: notifs = [] } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, enabled: !!user });
  const unread = notifs.filter((n) => !n.read_at).length;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(/\s|@/)[0].slice(0, 2).toUpperCase();

  const visibleMore = moreNav.filter((m) => !m.adminOnly || isAdmin);
  const moreActive = visibleMore.some((m) => pathname.startsWith(m.to));

  const navItem = (item: typeof primaryNav[number]) => {
    const active = pathname === item.to || pathname.startsWith(item.to + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
          active
            ? "bg-accent/10 text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
        <span className="flex-1">{t(`nav.${item.label}`, item.label)}</span>
        {item.to === "/communication" && unread > 0 && (
          <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">{unread}</Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        <Link to="/dashboard" className="px-5 py-5 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <span className="text-primary"><CompassLogo size={28} /></span>
          <div className="leading-tight">
            <div className="font-display text-base text-sidebar-foreground">Digital Invest</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Compass</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-0.5 pt-2">
          {primaryNav.map(navItem)}

          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  moreActive
                    ? "bg-accent/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <MoreHorizontal className={cn("size-4", moreActive && "text-accent")} />
                <span className="flex-1 text-left">{t("nav.More", "More")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-1.5">
              {visibleMore.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.to}
                    to={m.to}
                    className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4" />
                    <span>{t(`nav.${m.label}`, m.label)}</span>
                  </Link>
                );
              })}
            </PopoverContent>
          </Popover>
        </nav>

        <div className="border-t border-sidebar-border px-2.5 py-2.5">
          <LanguageSwitcher compact />
        </div>
      </aside>

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
                {t("search.placeholder", "Search everything")}
              </button>
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground">/</kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate({ to: "/inbox" })}>
              <Bell className="size-4" />
              {unread > 0 && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />}
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
                  {t("common.settings", "Settings")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
                  className="text-destructive"
                >
                  <LogOut className="size-4 mr-2" /> {t("common.signOut", "Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
        <QuickCreate openSignal={quickOpen} />
        <CommandBar open={cmdOpen} onOpenChange={setCmdOpen} />
        <Fab />
      </div>

      {aiMode !== "floating" && aiOpen && (
        <AiSidebar open={aiOpen} mode="docked" onModeChange={setAiMode} onClose={() => setAiOpen(false)} />
      )}
      {!aiOpen && <CollapsedRail onOpen={() => setAiOpen(true)} />}
      {aiMode === "floating" && aiOpen && (
        <AiSidebar open={aiOpen} mode="floating" onModeChange={setAiMode} onClose={() => setAiOpen(false)} />
      )}
    </div>
  );
}