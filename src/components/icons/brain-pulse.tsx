import { cn } from "@/lib/utils";

type Props = React.SVGProps<SVGSVGElement> & { className?: string; size?: number | string };

/**
 * BrainPulse — custom icon for the System Brain.
 * Concentric "scanning" rings around a center dot (the system
 * continuously observing itself).
 */
export function BrainPulse({ className, size = 16, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M7.4 12a4.6 4.6 0 0 1 9.2 0" opacity="0.85" />
      <path d="M4.8 12a7.2 7.2 0 0 1 14.4 0" opacity="0.5" />
      <path d="M2.5 12a9.5 9.5 0 0 1 19 0" opacity="0.25" />
    </svg>
  );
}

export default BrainPulse;
