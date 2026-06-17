import { cn } from "@/lib/utils";

type Props = React.SVGProps<SVGSVGElement> & { className?: string };

/**
 * CompassMark — custom brand icon for the Digital Invest Compass
 * intelligence layer. Replaces generic "AI sparkle" icons.
 * A compass rose with a needle pointing north-east (forward progress).
 */
export function BrandMark({ className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      <path
        d="M12 12 L15.5 8.5 L13 12 L15.5 15.5 Z"
        fill="currentColor"
        stroke="none"
        opacity="0.9"
      />
      <path
        d="M12 12 L8.5 15.5 L11 12 L8.5 8.5 Z"
        fill="currentColor"
        stroke="none"
        opacity="0.4"
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default BrandMark;