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
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="size-12 rounded-xl bg-muted grid place-items-center mb-4 text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
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