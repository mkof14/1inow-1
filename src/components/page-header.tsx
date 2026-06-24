import type { ReactNode } from "react";

/**
 * Shared lively page header — same visual language as the Projects page.
 * Icon chip + display title + subtitle, with optional right-side actions.
 * Wrap the page body in `fade-rise` for the same entrance feel.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className = "",
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-8 fade-rise ${className}`}>
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {icon && (
          <div className="text-accent shrink-0 transition-transform duration-500 hover:scale-110 hover:rotate-3">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl sm:text-2xl font-semibold tracking-tight font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
