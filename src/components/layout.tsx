import type { ReactNode, HTMLAttributes, ImgHTMLAttributes, ElementType } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

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
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl text-gradient-accent">{title}</h1>
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

/** Alias kept for naming parity with the design system spec. */
export const TableWrapper = ResponsiveTable;
export const ContentGrid = ResponsiveGrid;

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

/* -------------------------------------------------------------- */
/* Typography scale — use these instead of ad-hoc text-* classes  */
/* -------------------------------------------------------------- */

type TextProps = HTMLAttributes<HTMLElement> & { as?: ElementType };

export function PageTitle({ as: Tag = "h1", className, ...r }: TextProps) {
  return <Tag {...r} className={cn("min-w-0 truncate text-xl font-semibold leading-tight tracking-tight sm:text-2xl", className)} />;
}
export function SectionTitle({ as: Tag = "h2", className, ...r }: TextProps) {
  return <Tag {...r} className={cn("min-w-0 truncate text-base font-semibold leading-snug sm:text-lg", className)} />;
}
export function CardTitle({ as: Tag = "h3", className, ...r }: TextProps) {
  return <Tag {...r} className={cn("min-w-0 truncate text-sm font-semibold leading-snug", className)} />;
}
export function Body({ as: Tag = "p", className, ...r }: TextProps) {
  return <Tag {...r} className={cn("text-sm leading-relaxed text-foreground", className)} />;
}
export function Small({ as: Tag = "p", className, ...r }: TextProps) {
  return <Tag {...r} className={cn("text-xs leading-relaxed text-muted-foreground", className)} />;
}
export function Label({ as: Tag = "span", className, ...r }: TextProps) {
  return <Tag {...r} className={cn("text-xs font-medium uppercase tracking-wide text-muted-foreground", className)} />;
}

/* -------------------------------------------------------------- */
/* DataCard — title + value + optional trend / icon / footer.     */
/* -------------------------------------------------------------- */

export function DataCard({
  label,
  value,
  hint,
  icon: Icon,
  footer,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ElementType;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <SafeCard className={cn("relative flex flex-col gap-2 surface-aurora shimmer-border ring-accent-soft", className)}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      </div>
      <div className="min-w-0 truncate text-2xl font-semibold leading-tight text-gradient-accent">{value}</div>
      {hint && <div className="line-clamp-2 text-xs text-muted-foreground">{hint}</div>}
      {footer && <div className="mt-1 border-t border-border pt-2 text-xs">{footer}</div>}
    </SafeCard>
  );
}

/** Alias for the spec name. */
export const Card = SafeCard;

/* -------------------------------------------------------------- */
/* ModalShell — a centered, viewport-safe modal with header /     */
/* scrollable body / sticky footer.                                */
/* -------------------------------------------------------------- */

export function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const max = size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0", max)}>
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="truncate text-base font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="line-clamp-3 text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <DialogFooter className="sticky bottom-0 border-t border-border bg-card p-4">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* State components: Empty / Loading / Error / Confirm            */
/* -------------------------------------------------------------- */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: ElementType;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="relative mb-4 grid size-12 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
        <Icon className="size-6" />
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-accent live-dot" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-sm text-muted-foreground", className)}>
      <div className="relative grid size-12 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
        <Loader2 className="size-5 animate-spin" />
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-accent live-dot" />
      </div>
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  retry,
  className,
}: {
  title?: string;
  description?: ReactNode;
  retry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>}
      {retry && (
        <Button variant="outline" className="mt-5" onClick={retry}>Try again</Button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">{description}</p>
    </ModalShell>
  );
}
