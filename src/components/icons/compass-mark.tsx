import { cn } from "@/lib/utils";

type Props = React.SVGProps<SVGSVGElement> & { className?: string };

/**
 * BrandMark — 1inow logo mark. A stylised "1" with a sage-green dot
 * representing the present moment ("now"). Inherits color from
 * currentColor for the numeral and uses the --accent token for the dot.
 */
export function BrandMark({ className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-4", className)}
      {...props}
    >
      {/* Stylised "1" — a vertical stem with a short serif at the top-left */}
      <path
        d="M8.5 7.5 L12.5 5 L12.5 19 L15 19 L10 19 Z"
        fill="currentColor"
      />
      {/* "now" dot — sage green from accent token */}
      <circle cx="15" cy="6.5" r="2" fill="var(--accent)" />
    </svg>
  );
}

export default BrandMark;