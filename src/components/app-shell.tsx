import { type ReactNode, useState, useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { navSections, footerSections, type NavItem } from "@/lib/nav-config";
import { PortfolioCard, ExecutionNode, IntelligenceBars, TimelinePulse, ShieldLine, GearMark, SignalWave } from "@/components/icons/compass-icons";
import { useAuth } from "@/hooks/use-auth";
import { Search, Bell, LogOut, Moon, Sun, Plus, Twitter, Linkedin, Github, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/wave1";
import { QuickCreate } from "@/components/quick-create";
import { CommandBar } from "@/components/command-bar";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { BrandMark } from "@/components/icons/compass-mark";
import { AiSidebar, type AiSidebarMode } from "@/components/ai-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut, isAdmin } = useAuth() as any;
  const navigate = useNavigate();
  const t = useT();
  const [dark, setDark] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiSidebarMode>("floating");

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

  const navItem = (item: NavItem) => {
    const active = pathname === item.to || pathname.startsWith(item.to + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
          active
            ? "bg-accent/20 text-foreground font-semibold shadow-sm"
            : "text-muted-foreground hover:bg-accent/15 hover:text-foreground hover:translate-x-0.5",
        )}
      >
        <Icon className={cn("size-4 shrink-0 transition-colors group-hover:text-accent", active && "text-accent")} />
        <span className="flex-1 truncate">{t(`nav.${item.label}`, item.label)}</span>
        {item.to === "/communication" && unread > 0 && (
          <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">{unread}</Badge>
        )}
      </Link>
    );
  };

  // Role + context aware quick links pinned at the top of the footer.
  const quickLinks: NavItem[] = [
    { to: "/projects",  label: "Projects",  icon: PortfolioCard },
    { to: "/tasks",     label: "Tasks",     icon: ExecutionNode },
    { to: "/calendar",  label: "Calendar",  icon: TimelinePulse },
    { to: "/reports",   label: "Reports",   icon: IntelligenceBars },
    { to: "/communication", label: "Messages", icon: SignalWave },
    { to: "/settings",  label: "Settings",  icon: GearMark },
    ...(isAdmin ? [{ to: "/administration", label: "Admin Console", icon: ShieldLine } as NavItem] : []),
  ];
  const contextSection = pathname.split("/").filter(Boolean)[0];
  const orderedQuickLinks = [
    ...quickLinks.filter((l) => l.to === `/${contextSection}`),
    ...quickLinks.filter((l) => l.to !== `/${contextSection}`),
  ];
  const visibleFooterSections = [...navSections, ...footerSections];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        <Link to="/dashboard" className="px-5 py-6 flex flex-col gap-1 hover:opacity-90 transition-opacity">
          <BrandWordmark size={28} />
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">1inow.com</div>
        </Link>

        <div className="px-3 pb-2 space-y-2">
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border",
              aiOpen
                ? "gradient-compass text-primary-foreground border-transparent shadow-md"
                : "border-accent/30 bg-accent/5 text-foreground hover:bg-accent/10",
            )}
            title={t("ai.openTip", "1inow AI")}
          >
            <BrandMark className="size-4 shrink-0" />
            <span className="flex-1 text-left">1inow AI</span>
            <kbd className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border",
              aiOpen ? "border-primary-foreground/30 text-primary-foreground/80" : "border-border text-muted-foreground",
            )}>⌘J</kbd>
          </button>
          <button
            type="button"
            onClick={() => setQuickOpen((n) => n + 1)}
            className="w-full flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:border-accent/50 hover:text-foreground transition-colors"
            title={t("common.create", "Create")}
          >
            <Plus className="size-4 shrink-0" />
            <span className="flex-1 text-left">{t("common.create", "Create")}</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-4 pt-2">
          {navSections.map((section, idx) => (
            <div key={section.id} className={cn(idx > 0 && "mt-4")}>
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {t(`nav.section.${section.id}`, section.label)}
              </div>
              <div className="space-y-0.5">
                {section.items.map(navItem)}
              </div>
            </div>
          ))}
        </nav>
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-lg"
              onClick={() => setQuickOpen((n) => n + 1)}
              title={t("common.create", "Create")}
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="outline"
              className={cn(
                "relative h-9 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium sm:px-3",
                aiOpen && "border-accent/50 bg-accent/10 text-accent",
              )}
              onClick={() => setAiOpen((v) => !v)}
              title={t("ai.openTip", "1inow AI")}
            >
              <BrandMark className="size-4" />
              <span className="hidden sm:inline">1inow AI</span>
              <span className="sm:hidden">AI</span>
              {aiOpen && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />}
            </Button>
            <LanguageSwitcher />
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

        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto flex flex-col">
          <div className="min-w-0 w-full flex-1">{children}</div>
        <footer className="mt-16 border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
              <BrandWordmark size={20} />
            </div>
            <div className="mb-8">
              <div className="text-[13px] font-semibold text-foreground mb-3">Quick access</div>
              <div className="flex flex-wrap gap-2">
                {orderedQuickLinks.map((l) => {
                  const Icon = l.icon;
                  const isCurrent = pathname === l.to || pathname.startsWith(l.to + "/");
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                        isCurrent
                          ? "border-accent/40 bg-accent/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-accent/30 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span>{t(`nav.${l.label}`, l.label)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {visibleFooterSections.map((section) => (
                <div key={section.id} className="min-w-0">
                  <div className="text-[13px] font-semibold text-foreground mb-3">
                    {t(`nav.section.${section.id}`, section.label)}
                  </div>
                  <ul className="space-y-2">
                    {section.items.filter((i) => !i.adminOnly || isAdmin).map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="text-[13px] text-muted-foreground hover:text-foreground block py-0.5 transition-colors"
                        >
                          {t(`nav.${item.label}`, item.label)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-[12px] text-muted-foreground">
                Copyright © {new Date().getFullYear()} 1inow Inc. All rights reserved.
              </span>

              <div className="flex items-center gap-5 text-[12px] text-muted-foreground">
                <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
              </div>

              <div className="flex items-center gap-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <Twitter className="size-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                  <Linkedin className="size-4" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                  <Github className="size-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="YouTube">
                  <Youtube className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </footer>
        </main>
        <QuickCreate openSignal={quickOpen} />
        <CommandBar open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>

      {aiMode !== "floating" && aiOpen && (
        <AiSidebar open={aiOpen} mode="docked" onModeChange={setAiMode} onClose={() => setAiOpen(false)} />
      )}
      {aiMode === "floating" && aiOpen && (
        <AiSidebar open={aiOpen} mode="floating" onModeChange={setAiMode} onClose={() => setAiOpen(false)} />
      )}
    </div>
  );
}