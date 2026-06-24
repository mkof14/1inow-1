import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

/* Thinking Engine — orbit + inner pulse. Custom to Compass theme. */
export function ThinkingLoop({ size = 16, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      {...rest}
    >
      <ellipse cx="12" cy="12" rx="9" ry="4.5" />
      <ellipse cx="12" cy="12" rx="4.5" ry="9" opacity=".55" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}
