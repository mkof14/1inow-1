import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "1inow:install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function recentlyDismissed() {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    return Date.now() - Number(v) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [iosVisible, setIosVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (recentlyDismissed()) {
      setDismissed(true);
      return;
    }
    // Already installed → don't show
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS legacy flag
      (navigator as any).standalone === true;
    if (standalone) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setEvt(null);
      setIosVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari never fires beforeinstallprompt — show manual hint.
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS && isSafari) {
      const tm = setTimeout(() => setIosVisible(true), 1500);
      return () => {
        clearTimeout(tm);
        window.removeEventListener("beforeinstallprompt", onBIP);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDismissed(true);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
  };

  if (dismissed) return null;
  if (!evt && !iosVisible) return null;

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md",
        // sit above mobile bottom nav, near bottom on desktop too
        "bottom-[calc(env(safe-area-inset-bottom,0)+4.5rem)] md:bottom-6",
      )}
      role="dialog"
      aria-label="Install 1inow"
    >
      <div className="rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl p-3.5 flex items-start gap-3">
        <div className="rounded-xl bg-accent/15 text-accent p-2 shrink-0">
          <Download className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Установить 1inow</div>
          {evt ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Запускай как приложение — отдельная иконка, полный экран, быстрее.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
              Нажми <Share className="inline size-3.5" /> «Поделиться» → «На экран „Домой“».
            </p>
          )}
          {evt && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={install} className="h-8">
                Установить
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss} className="h-8">
                Позже
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 -mt-1 -mr-1"
          onClick={dismiss}
          aria-label="Закрыть"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}