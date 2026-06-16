import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translateText } from "@/lib/translate.functions";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type Mode = "original" | "translated" | "both";

export function TranslateButton({
  text,
  sourceLang,
  onTranslated,
}: {
  text: string;
  sourceLang?: string;
  onTranslated?: (translated: string, mode: Mode) => void;
}) {
  const { lang, t } = useI18n();
  const translate = useServerFn(translateText);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("original");
  const [translated, setTranslated] = useState<string | null>(null);

  const handle = async () => {
    if (sourceLang && sourceLang === lang) {
      toast.info("Already in your language");
      return;
    }
    if (translated) {
      const next: Mode = mode === "original" ? "translated" : mode === "translated" ? "both" : "original";
      setMode(next);
      onTranslated?.(translated, next);
      return;
    }
    setBusy(true);
    try {
      const r = await translate({ data: { text, targetLang: lang, sourceLang } });
      setTranslated(r.text);
      setMode("translated");
      onTranslated?.(r.text, "translated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setBusy(false);
    }
  };

  const label = !translated
    ? t("common.translate")
    : mode === "original"
      ? t("common.showTranslation")
      : mode === "translated"
        ? t("common.showBoth")
        : t("common.showOriginal");

  return (
    <Button variant="ghost" size="sm" onClick={handle} disabled={busy} className="h-6 gap-1 text-xs">
      {busy ? <Loader2 className="size-3 animate-spin" /> : <Languages className="size-3" />}
      {label}
    </Button>
  );
}