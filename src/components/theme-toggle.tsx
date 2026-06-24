import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  if (showLabel) {
    return (
      <Button variant="ghost" size="sm" onClick={toggle} className={cn("gap-1.5", className)}>
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        <span className="text-sm">{dark ? "Light" : "Dark"}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
