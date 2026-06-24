import { type ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { navSections, footerSections, type NavItem } from "@/lib/nav-config";
import {
  PortfolioCard,
  ExecutionNode,
  IntelligenceBars,
  TimelinePulse,
  ShieldLine,
  GearMark,
  SignalWave,
} from "@/components/icons/compass-icons";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  ArrowRight,
  Bell,
  Home,
  LogOut,
  Moon,
  Sun,
  Plus,
  Search,
  Linkedin,
  Github,
  Youtube,
  Menu,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPrompt } from "@/components/install-prompt";
import { VoiceCommandCenter } from "@/components/voice-command-center";
import { SENSE_ASSETS, SENSE_NAME } from "@/lib/sense-assets";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, signOut } = useAuth() as any;
  const navigate = useNavigate();
  const t = useT();
  const [dark, setDark] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiSidebarMode>("floating");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
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

  useEffect(() => {
    const openVoice = () => setVoiceOpen(true);
    window.addEventListener("1inow:open-voice", openVoice);
    return () => window.removeEventListener("1inow:open-voice", openVoice);
  }, []);

  useShortcuts(
    () => setCmdOpen(true),
    () => setQuickOpen((n) => n + 1),
  );

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: !!user,
  });
  const unread = notifs.filter((n) => !n.read_at).length;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/" });
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(/\s|@/)[0]
    .slice(0, 2)
    .toUpperCase();

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
        <Icon
          className={cn(
            "size-4 shrink-0 transition-colors group-hover:text-accent",
            active && "text-accent",
          )}
        />
        <span className="flex-1 truncate">{t(`nav.${item.label}`, item.label)}</span>
        {item.to === "/communication" && unread > 0 && (
          <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
            {unread}
          </Badge>
        )}
      </Link>
    );
  };

  // Role + context aware quick links pinned at the top of the footer.
  const quickLinks: NavItem[] = [
    { to: "/projects", label: "Projects", icon: PortfolioCard },
    { to: "/tasks", label: "Tasks", icon: ExecutionNode },
    { to: "/calendar", label: "Calendar", icon: TimelinePulse },
    { to: "/communication", label: "Messages", icon: SignalWave },
    { to: "/intelligence", label: "Intelligence", icon: IntelligenceBars },
    { to: "/settings", label: "Settings", icon: GearMark },
    ...(isAdmin
      ? [{ to: "/administration", label: "Admin Console", icon: ShieldLine } as NavItem]
      : []),
  ];
  const contextSection = pathname.split("/").filter(Boolean)[0];
  const orderedQuickLinks = [
    ...quickLinks.filter((l) => l.to === `/${contextSection}`),
    ...quickLinks.filter((l) => l.to !== `/${contextSection}`),
  ];
  const visibleFooterSections = [...navSections, ...footerSections];
  const allNavItems = useMemo(
    () => [...navSections, ...footerSections].flatMap((section) => section.items),
    [],
  );
  const activeItem = allNavItems
    .filter((item) => !item.adminOnly || isAdmin)
    .find((item) => pathname === item.to || pathname.startsWith(item.to + "/"));

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        <Link
          to="/dashboard"
          className="px-5 py-6 flex flex-col gap-1 hover:opacity-90 transition-opacity"
        >
          <BrandWordmark size={28} />
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            1inow.com
          </div>
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
            title={SENSE_NAME}
          >
            <img src={SENSE_ASSETS.sense} alt="" className="size-5 shrink-0 rounded-md" />
            <span className="flex-1 text-left">Sense</span>
            <kbd
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                aiOpen
                  ? "border-primary-foreground/30 text-primary-foreground/80"
                  : "border-border text-muted-foreground",
              )}
            >
              ⌘J
            </kbd>
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
              <div className="space-y-0.5">{section.items.map(navItem)}</div>
            </div>
          ))}
        </nav>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link to="/dashboard" className="px-5 py-5 flex flex-col gap-1">
            <BrandWordmark size={26} />
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              1inow.com
            </div>
          </Link>
          <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
            {navSections.map((section, idx) => (
              <div key={section.id} className={cn(idx > 0 && "mt-4")}>
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  {t(`nav.section.${section.id}`, section.label)}
                </div>
                <div className="space-y-0.5">{section.items.map(navItem)}</div>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-background/70 backdrop-blur-md flex items-center justify-between gap-2 px-3 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <Link to="/dashboard" className="md:hidden shrink-0 flex items-center">
              <BrandMark className="size-6" />
            </Link>
            <div className="relative w-full max-w-sm hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                data-global-search
                className="w-full text-left bg-muted/50 border border-transparent hover:border-border rounded-md pl-8 pr-12 py-1.5 text-[13px] text-muted-foreground transition-colors"
              >
                {t("search.placeholder", "Search everything")}
              </button>
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                /
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setCmdOpen(true)}
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-lg hidden sm:inline-flex"
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
              title={SENSE_NAME}
            >
              <img src={SENSE_ASSETS.sense} alt="" className="size-4 rounded" />
              <span>Sense</span>
              {aiOpen && (
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />
              )}
            </Button>
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div className="sm:hidden">
              <LanguageSwitcher compact />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate({ to: "/inbox" })}
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 ml-1 sm:ml-2 rounded-full hover:bg-muted px-1 sm:px-1.5 py-1 transition-colors">
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
                <DropdownMenuItem onClick={() => setQuickOpen((n) => n + 1)} className="sm:hidden">
                  {t("common.create", "Create")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/" })}>
                  <Home className="mr-2 size-4" />
                  Public Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  {t("common.settings", "Settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  {t("common.signOut", "Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto flex flex-col">
          <LiveContextBar
            activeLabel={activeItem?.label ?? "Workspace"}
            activeIcon={activeItem?.icon ?? BrandMark}
            pathname={pathname}
            unread={unread}
            onCreate={() => setQuickOpen((n) => n + 1)}
            onAsk={() => setAiOpen(true)}
          />
          <div className="min-w-0 w-full flex-1 pb-20 pt-10 md:pb-0 md:pt-12 lg:pt-14">
            {children}
          </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
                {visibleFooterSections.map((section) => (
                  <div key={section.id} className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground mb-3">
                      {t(`nav.section.${section.id}`, section.label)}
                    </div>
                    <ul className="space-y-2">
                      {section.items
                        .filter((i) => !i.adminOnly || isAdmin)
                        .map((item) => (
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
                  <Link to="/legal/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                  <Link to="/legal/terms" className="hover:text-foreground transition-colors">
                    Terms of Use
                  </Link>
                </div>

                <div className="flex items-center gap-1 -ml-2 sm:ml-0">
                  <LanguageSwitcher />
                  <ThemeToggle showLabel />
                </div>

                <div className="flex items-center gap-4">
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="X"
                  >
                    <span className="text-sm font-black leading-none">X</span>
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="size-4" />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="size-4" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </main>
        <QuickCreate openSignal={quickOpen} />
        <CommandBar open={cmdOpen} onOpenChange={setCmdOpen} />
        <VoiceCommandCenter open={voiceOpen} onOpenChange={setVoiceOpen} showLauncher={false} />
        <MobileBottomNav />
        <InstallPrompt />
      </div>

      {aiMode !== "floating" && aiOpen && (
        <AiSidebar
          open={aiOpen}
          mode="docked"
          onModeChange={setAiMode}
          onClose={() => setAiOpen(false)}
          onOpenVoiceCommand={() => setVoiceOpen(true)}
        />
      )}
      {aiMode === "floating" && aiOpen && (
        <AiSidebar
          open={aiOpen}
          mode="floating"
          onModeChange={setAiMode}
          onClose={() => setAiOpen(false)}
          onOpenVoiceCommand={() => setVoiceOpen(true)}
        />
      )}
    </div>
  );
}

function LiveContextBar({
  activeLabel,
  activeIcon: ActiveIcon,
  pathname,
  unread,
  onCreate,
  onAsk,
}: {
  activeLabel: string;
  activeIcon: NavItem["icon"];
  pathname: string;
  unread: number;
  onCreate: () => void;
  onAsk: () => void;
}) {
  const context = getLiveContext(pathname, unread);

  return (
    <div className="sticky top-14 z-[9] border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-12 w-full max-w-[1500px] items-center gap-3 px-3 py-2 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative grid size-8 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
            <ActiveIcon className="size-4" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent live-dot" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{activeLabel}</span>
              <span className="hidden rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex">
                {context.status}
              </span>
            </div>
            <div className="truncate text-xs text-muted-foreground">{context.next}</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {context.signals.map((signal) => (
            <span
              key={signal}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-accent" />
              {signal}
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onAsk}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/15"
          >
            <Zap className="size-3.5 text-accent" />
            <span className="hidden sm:inline">Ask</span>
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
          <Activity className="hidden size-4 text-accent live-breathe sm:block" />
        </div>
      </div>
    </div>
  );
}

function getLiveContext(pathname: string, unread: number) {
  if (pathname.startsWith("/projects")) {
    return {
      status: "Planning",
      next: "Open the active project, review progress, or create the next outcome.",
      signals: ["progress", "priority", "owners"],
    };
  }
  if (pathname.startsWith("/tasks")) {
    return {
      status: "Execution",
      next: "Move work through the board. Keep the next visible action small.",
      signals: ["drag", "due dates", "status"],
    };
  }
  if (pathname.startsWith("/communication") || pathname.startsWith("/inbox")) {
    return {
      status: unread > 0 ? "Attention" : "Clear",
      next:
        unread > 0
          ? `${unread} unread signal${unread === 1 ? "" : "s"} waiting.`
          : "No unread signals. Continue from the workspace.",
      signals: ["messages", "decisions", "follow-ups"],
    };
  }
  if (
    pathname.startsWith("/intelligence") ||
    pathname.startsWith("/ai") ||
    pathname.startsWith("/brain") ||
    pathname.startsWith("/thinking")
  ) {
    return {
      status: "Context",
      next: "Capture context, questions, rules, and evidence before action.",
      signals: ["memory", "rules", "confidence"],
    };
  }
  if (pathname.startsWith("/administration")) {
    return {
      status: "Control",
      next: "Review access, system settings, and operational audit signals.",
      signals: ["roles", "policies", "audit"],
    };
  }
  if (pathname.startsWith("/calendar")) {
    return {
      status: "Timing",
      next: "Use dates to turn scattered work into a sequence.",
      signals: ["today", "deadlines", "rhythm"],
    };
  }
  if (pathname.startsWith("/people") || pathname.startsWith("/teams")) {
    return {
      status: "People",
      next: "Check ownership, team shape, and who should move what next.",
      signals: ["owners", "roles", "capacity"],
    };
  }
  return {
    status: "Live",
    next: "Start with the next useful action: ask, create, review, or decide.",
    signals: ["ready", "context", "next step"],
  };
}
