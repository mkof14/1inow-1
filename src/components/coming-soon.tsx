import type { ReactNode } from "react";
import { BrandMark } from "@/components/icons/compass-icons";
import { useT } from "@/lib/i18n";

/**
 * Clean empty-state shell for routes whose deeper functionality is not yet
 * available. Renders ONLY a real header — no fake mockup data, no shimmer
 * bars — so users see honest emptiness instead of fabricated content.
 */
export function ComingSoon({
  title,
  description,
  eyebrow,
  icon,
  actions,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 px-4 py-12 sm:px-6 md:py-20 fade-rise">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 grid size-16 place-items-center rounded-2xl border border-border bg-muted/30 text-muted-foreground/60">
          {icon ?? <BrandMark size={36} />}
        </div>
        {eyebrow && (
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl mt-2 text-foreground sm:text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
          {description}
        </p>
        <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
          {t("empty.nothing", "Nothing here yet")}
        </p>
        {actions && <div className="mt-6">{actions}</div>}
      </div>
    </div>
  );
}