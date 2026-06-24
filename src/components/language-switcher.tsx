import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";

const META: Record<string, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  uk: { native: "Українська", flag: "🇺🇦" },
  ru: { native: "Русский", flag: "🇷🇺" },
  es: { native: "Español", flag: "🇪🇸" },
  de: { native: "Deutsch", flag: "🇩🇪" },
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const codes = Object.keys(dictionaries);
  const cur = META[lang] ?? { native: lang.toUpperCase(), flag: "🌐" };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="gap-1.5">
          {compact ? (
            <Languages className="size-4" />
          ) : (
            <>
              <span>{cur.flag}</span>
              <span className="text-sm">{cur.native}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {codes.map((code) => {
          const m = META[code] ?? { native: code, flag: "🌐" };
          return (
            <DropdownMenuItem key={code} onClick={() => setLang(code)} className="gap-2">
              <span>{m.flag}</span>
              <span className="flex-1">{m.native}</span>
              {lang === code && <span className="text-xs text-primary">●</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
