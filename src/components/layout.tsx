import type { ReactNode, HTMLAttributes, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Standard outer container for every page. Handles padding + max width + min-w-0. */
export function PageContainer({
  className,
  children,
  size = "default",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { size?: "default" | "narrow" | "wide" | "full" }) {
  const max =
    size === "narrow" ? "max-w-3xl"
    : size === "wide" ? "max-w-7xl"
    : size === "full" ? "max-w-none"
    : "max-w-6xl";
  return (
    <div
      {...rest}
      className={cn(
        "mx-auto w-full min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8",
        max,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Responsive auto-fit grid. */
export function ResponsiveGrid({
  className,
  children,
  min = 260,
  gap = "gap-4",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { min?: number; gap?: string }) {
  return (
    <div
      {...rest}
      className={cn("grid w-full min-w-0", gap, className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, ...(rest.style || {}) }}
    >
      {children}
    </div>
  );
}

/** Card that never overflows its container. */
export function SafeCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 text-card-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Text that truncates safely. Use `lines` for multi-line clamp. */
export function SafeText({
  as: Tag = "span",
  lines = 1,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: any; lines?: number }) {
  const clamp = lines <= 1 ? "truncate" : "";
  const style = lines > 1 ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : undefined;
  return (
    <Tag {...rest} className={cn("min-w-0 break-words", clamp, className)} style={{ ...style, ...(rest as any).style }}>
      {children}
    </Tag>
  );
}

/** Wraps a table so it scrolls horizontally on small screens. */
export function ResponsiveTable({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("w-full min-w-0 overflow-x-auto rounded-lg border border-border", className)}>
      <div className="min-w-full">{children}</div>
    </div>
  );
}

/** Image frame preserves aspect ratio, never stretches, never overflows. */
export function ImageFrame({
  src,
  alt = "",
  ratio = "16/9",
  fit = "cover",
  className,
  rounded = true,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { ratio?: string; fit?: "cover" | "contain"; rounded?: boolean }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-muted",
        rounded && "rounded-lg",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        {...rest}
        className={cn(
          "absolute inset-0 h-full w-full",
          fit === "cover" ? "object-cover" : "object-contain",
        )}
      />
    </div>
  );
}

/** Centers a modal body and keeps it inside the viewport. */
export function ModalContainer({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  );
}

/** Right-side panel that does not cover main content (sits inline) unless `overlay`. */
export function SidePanel({
  className,
  children,
  overlay = false,
  width = "w-80",
}: {
  className?: string;
  children: ReactNode;
  overlay?: boolean;
  width?: string;
}) {
  if (overlay) {
    return (
      <aside className={cn("fixed inset-y-0 right-0 z-30 max-w-[90vw] border-l border-border bg-card shadow-xl", width, className)}>
        <div className="h-full overflow-y-auto p-4">{children}</div>
      </aside>
    );
  }
  return (
    <aside className={cn("hidden shrink-0 border-l border-border bg-card xl:block", width, className)}>
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">{children}</div>
    </aside>
  );
}