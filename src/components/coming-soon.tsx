import type { ReactNode } from "react";
import { CompassMark } from "@/components/icons/compass-icons";

/**
 * Premium placeholder shell for routes whose deeper functionality lands in
 * later waves. Mirrors the visual language of the rest of the product so it
 * never looks like an unfinished page.
 */
export function ComingSoon({
  title,
  description,
  eyebrow = "Compass module",
  icon,
  actions,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto fade-rise">
      <header className="flex items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="font-display text-4xl md:text-5xl mt-1.5 text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">{description}</p>
        </div>
        {actions}
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="panel-compass p-5 min-h-[180px] relative overflow-hidden"
          >
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent signal-pulse" /> Module pending
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 rounded-full bg-muted w-3/4" />
              <div className="h-2 rounded-full bg-muted w-1/2" />
              <div className="h-2 rounded-full bg-muted w-2/3" />
            </div>
            <div className="absolute -bottom-10 -right-10 text-muted-foreground/15">
              {icon ?? <CompassMark size={140} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}