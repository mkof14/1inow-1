import { Link, useRouterState } from "@tanstack/react-router";
import {
  PortfolioCard,
  ExecutionNode,
  TimelinePulse,
  BrandMark,
} from "@/components/icons/compass-icons";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const items = [
  { to: "/dashboard", label: "Home", icon: BrandMark },
  { to: "/projects", label: "Projects", icon: PortfolioCard },
  { to: "/tasks", label: "Tasks", icon: ExecutionNode },
  { to: "/calendar", label: "Calendar", icon: TimelinePulse },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-h-14 py-2 text-[11px] transition-colors",
                  active
                    ? "text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                <span>{t(`nav.${item.label}`, item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
