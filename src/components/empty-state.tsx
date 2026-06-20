import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: typeof Inbox;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="relative rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft fade-rise flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="relative mb-4">
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl blur-xl opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 40%, transparent), transparent 70%)",
          }}
        />
        <div className="relative size-14 rounded-xl border border-accent/30 bg-card/70 backdrop-blur grid place-items-center text-accent shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--accent)_55%,transparent)]">
          <Icon className="size-6" />
        </div>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-8 space-y-4 animate-pulse">
      <div className="h-7 w-40 bg-muted rounded" />
      <div className="h-4 w-72 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}