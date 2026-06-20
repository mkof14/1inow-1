import { useEffect, useMemo, useState } from "react";
import {
  Download,
  X,
  Share,
  Plus,
  Chrome,
  MoreVertical,
  AppWindow,
  Smartphone,
} from "lucide-react";
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

type Platform = "ios-safari" | "android-chrome" | "desktop-chromium" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (isIOS && isSafari) return "ios-safari";
  const isAndroid = /Android/.test(ua);
  const isChromium = /Chrome|CriOS|Edg|EdgiOS/.test(ua);
  if (isAndroid && isChromium) return "android-chrome";
  if (isChromium) return "desktop-chromium";
  return "other";
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [manualVisible, setManualVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const platform = useMemo(detectPlatform, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (recentlyDismissed()) {
      setDismissed(true);
      return;
    }
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setEvt(null);
      setManualVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari never fires beforeinstallprompt — show manual hint with steps.
    if (platform === "ios-safari") {
      const tm = setTimeout(() => setManualVisible(true), 1500);
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
  }, [platform]);

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
  if (!evt && !manualVisible) return null;

  const PlatformIcon =
    platform === "ios-safari" || platform === "android-chrome" ? Smartphone : AppWindow;

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md",
        "bottom-[calc(env(safe-area-inset-bottom,0)+4.5rem)] md:bottom-6",
      )}
      role="dialog"
      aria-label="Install 1inow"
    >
      <div className="rounded-2xl border border-accent/30 bg-background/95 backdrop-blur-md shadow-2xl p-3.5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent/15 text-accent p-2 shrink-0 ring-1 ring-accent/30">
            <PlatformIcon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Установить 1inow</div>
            {evt ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                {platform === "desktop-chromium"
                  ? "Отдельное окно на десктопе — без вкладок, иконка в Dock/Taskbar."
                  : "Отдельная иконка, полный экран, запускается как приложение."}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Safari не показывает кнопку «Установить» — добавь вручную за 2 шага:
              </p>
            )}

            {evt && (
              <div className="mt-2.5 flex gap-2">
                <Button size="sm" onClick={install} className="h-8 gap-1.5">
                  <Download className="size-3.5" />
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

        {/* Per-platform steps */}
        {!evt && platform === "ios-safari" && (
          <ol className="mt-3 space-y-1.5 text-xs">
            <Step
              n={1}
              icon={<Share className="size-3.5 text-sky-500" />}
              text={<>Тапни <span className="font-medium text-foreground">«Поделиться»</span> в нижней панели Safari</>}
            />
            <Step
              n={2}
              icon={<Plus className="size-3.5 text-emerald-500" />}
              text={<>Выбери <span className="font-medium text-foreground">«На экран „Домой“»</span> → <span className="font-medium text-foreground">«Добавить»</span></>}
            />
          </ol>
        )}

        {platform === "desktop-chromium" && evt && (
          <ol className="mt-3 space-y-1.5 text-xs">
            <Step
              n={1}
              icon={<Download className="size-3.5 text-accent" />}
              text={<>Жми <span className="font-medium text-foreground">«Установить»</span> выше — Chrome/Edge откроет системное окно</>}
            />
            <Step
              n={2}
              icon={<AppWindow className="size-3.5 text-emerald-500" />}
              text={<>Подтверди — иконка появится в Dock (macOS) или меню «Пуск» (Windows)</>}
            />
          </ol>
        )}

        {/* Fallback hint when no BIP on non-iOS (e.g. Firefox/Safari desktop) */}
        {!evt && platform !== "ios-safari" && manualVisible && (
          <ol className="mt-3 space-y-1.5 text-xs">
            <Step
              n={1}
              icon={<MoreVertical className="size-3.5 text-foreground" />}
              text={<>Открой меню браузера (⋮) в правом верхнем углу</>}
            />
            <Step
              n={2}
              icon={<Chrome className="size-3.5 text-accent" />}
              text={<>Выбери <span className="font-medium text-foreground">«Установить 1inow»</span> или <span className="font-medium text-foreground">«Создать ярлык…»</span></>}
            />
          </ol>
        )}
      </div>
    </div>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
        {n}
      </span>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span className="text-muted-foreground leading-relaxed">{text}</span>
    </li>
  );
}