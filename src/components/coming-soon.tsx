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
      <div className="relative rounded-3xl border border-border surface-aurora shimmer-border ring-accent-soft p-10 md:p-14 overflow-hidden">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 45%, transparent), transparent 70%)",
              }}
            />
            <div className="relative grid size-20 place-items-center rounded-2xl border border-accent/30 bg-card/70 backdrop-blur text-accent shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent)_55%,transparent)]">
              {icon ?? <BrandMark size={42} />}
            </div>
          </div>
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent/80">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl mt-2 text-gradient-accent sm:text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
            {description}
          </p>
          <p className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            <span className="size-1.5 rounded-full bg-accent signal-pulse" />
            {t("empty.nothing", "Nothing here yet")}
          </p>
          {actions && <div className="mt-6">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
