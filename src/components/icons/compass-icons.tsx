import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function base({ size = 16, className, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("shrink-0", className),
    ...rest,
  };
}

/* Compass mark — N pointer in a ring. Used for Command View + Favorites. */
export function BrandMark(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 4.5l2.2 7L12 19.5l-2.2-8z" fill="currentColor" fillOpacity=".18" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

/* Portfolio — layered cards */
export function PortfolioCard(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="6" width="14" height="11" rx="2" />
      <rect x="6.5" y="3" width="14" height="11" rx="2" opacity=".55" />
    </svg>
  );
}

/* Execution — node connected to two endpoints */
export function ExecutionNode(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M7 12l10-6M7 12l10 6" />
    </svg>
  );
}

/* Signal wave — concentric arcs */
export function SignalWave(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
      <path d="M5 13a6 6 0 0 1 6 6" />
      <path d="M5 7a12 12 0 0 1 12 12" />
      <path d="M5 1a18 18 0 0 1 18 18" opacity=".5" />
    </svg>
  );
}

/* Timeline pulse — heartbeat line */
export function TimelinePulse(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M2 12h4l2-5 3 10 3-7 2 4h6" />
    </svg>
  );
}

/* People orbit */
export function PeopleOrbit(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" opacity=".3" />
      <circle cx="12" cy="9" r="2.2" />
      <path d="M6.5 18c1.2-2.4 3.3-3.6 5.5-3.6S16.3 15.6 17.5 18" />
    </svg>
  );
}

/* Knowledge — open book with bookmark */
export function KnowledgeLens(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 5h6a3 3 0 0 1 3 3v11" />
      <path d="M20 5h-6a3 3 0 0 0-3 3v11" />
      <path d="M4 5v13h7" opacity=".5" />
      <path d="M20 5v13h-7" opacity=".5" />
    </svg>
  );
}

/* Vault mark — diamond inside square */
export function VaultMark(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M12 7l5 5-5 5-5-5z" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

/* Decision diamond — rotated square with check */
export function DecisionDiamond(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 2.5l9.5 9.5L12 21.5 2.5 12z" />
      <path d="M8.5 12.2l2.5 2.3 4.5-5" />
    </svg>
  );
}

/* Intelligence — bars in a frame */
export function IntelligenceBars(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M8 16V11" />
      <path d="M12 16V7" />
      <path d="M16 16v-6" />
    </svg>
  );
}

/* Advisor — compass ring + center node (no sparkle) */
export function AdvisorRing(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" opacity=".5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  );
}

/* Control — shield with line */
export function ShieldLine(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

/* Direction arrow */
export function DirectionArrow(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 12h13" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/* Inbox route */
export function InboxRoute(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 13l3-7h12l3 7" />
      <path d="M3 13h5l2 3h4l2-3h5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

/* Briefcase / My work */
export function WorkMark(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="7" width="17" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3.5 12h17" />
    </svg>
  );
}

/* Settings cog (minimal) */
export function GearMark(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}

/* Help — circle with question */
export function HelpMark(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7" />
      <circle cx="12" cy="17" r=".8" fill="currentColor" />
    </svg>
  );
}

/* 1inow logomark — stylised "1" with a green "now" dot, on a soft rounded square. */
export function BrandLogo({ size = 28, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn(className)}
      {...rest}
    >
      <rect x="1" y="1" width="30" height="30" rx="7" fill="var(--primary)" />
      {/* Stylised "1" in cream */}
      <path
        d="M11 10 L17 6.5 L17 25 L20 25 L13 25 Z"
        fill="var(--primary-foreground)"
      />
      {/* Sage green dot — the "now" */}
      <circle cx="20" cy="8" r="2.6" fill="var(--accent)" />
    </svg>
  );
}

/* 1inow wordmark — full "1inow" lockup as SVG-free HTML usage helper. */
export function BrandWordmark({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("inline-flex items-baseline font-semibold tracking-tight", className)}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      <span className="relative text-accent" style={{ marginRight: 1 }}>
        1
        <span
          aria-hidden
          className="absolute rounded-full bg-accent"
          style={{
            width: size * 0.22,
            height: size * 0.22,
            top: -size * 0.08,
            right: -size * 0.18,
          }}
        />
      </span>
      <span className="text-foreground">inow</span>
    </span>
  );
}