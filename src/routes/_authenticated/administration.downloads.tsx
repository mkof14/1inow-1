import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Apple, Smartphone, Download, ExternalLink, Info, Loader2, Activity, Copy, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/administration/downloads")({
  component: DownloadsPage,
});

const DISMISS_KEY = "1inow:install-dismissed-at";

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString() + " " + d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function DiagRow({
  label,
  status,
  value,
  hint,
}: {
  label: string;
  status: "ok" | "warn" | "bad" | "info";
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  const Icon =
    status === "ok" ? CheckCircle2 : status === "bad" ? XCircle : status === "warn" ? AlertCircle : Info;
  const tone =
    status === "ok"
      ? "text-emerald-500"
      : status === "bad"
      ? "text-red-500"
      : status === "warn"
      ? "text-amber-500"
      : "text-sky-500";
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <Icon className={`size-4 mt-0.5 shrink-0 ${tone}`} />
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
        </div>
      </div>
      <div className="text-xs font-mono text-foreground/90 text-right break-all max-w-[55%]">{value}</div>
    </div>
  );
}

function PwaDiagnostics({
  bipFired,
  bipFiredAt,
  appInstalledAt,
  tick,
  onRefresh,
}: {
  bipFired: boolean;
  bipFiredAt: string | null;
  appInstalledAt: string | null;
  tick: number;
  onRefresh: () => void;
}) {
  const diag = useMemo(() => {
    if (typeof window === "undefined") return null;
    const ua = navigator.userAgent || "";
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isChromium = /Chrome|CriOS|Edg|EdgiOS/.test(ua);
    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    let platform = "Other";
    if (isIOS && isSafari) platform = "iOS Safari";
    else if (isAndroid && isChromium) platform = "Android Chrome/Edge";
    else if (isChromium) platform = "Desktop Chrome/Edge";
    else if (isIOS) platform = "iOS (non-Safari)";

    let dismissedAt: string | null = null;
    let dismissedActive = false;
    try {
      const v = localStorage.getItem(DISMISS_KEY);
      if (v) {
        dismissedAt = new Date(Number(v)).toISOString();
        dismissedActive = Date.now() - Number(v) < 7 * 24 * 60 * 60 * 1000;
      }
    } catch {}

    const hasSW = "serviceWorker" in navigator;
    const isSecure = window.isSecureContext;
    const proto = window.location.protocol;
    const host = window.location.host;
    return {
      platform,
      standalone,
      inIframe,
      isSecure,
      proto,
      host,
      hasSW,
      ua,
      dismissedAt,
      dismissedActive,
    };
  }, [tick]);

  if (!diag) return null;

  const clearDismiss = () => {
    try {
      localStorage.removeItem(DISMISS_KEY);
      toast.success("Dismissed-at очищен");
      onRefresh();
    } catch {
      toast.error("Не удалось очистить localStorage");
    }
  };

  const copyAll = () => {
    const payload = {
      platform: diag.platform,
      url: `${diag.proto}//${diag.host}`,
      standalone: diag.standalone,
      inIframe: diag.inIframe,
      isSecureContext: diag.isSecure,
      hasServiceWorkerAPI: diag.hasSW,
      beforeinstallpromptFired: bipFired,
      beforeinstallpromptAt: bipFiredAt,
      appInstalledAt,
      dismissedAt: diag.dismissedAt,
      dismissedActive: diag.dismissedActive,
      userAgent: diag.ua,
    };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    toast.success("Диагностика скопирована");
  };

  // Heuristic: why banner might not show
  const reasons: string[] = [];
  if (diag.standalone) reasons.push("Уже запущено в standalone — баннер не нужен");
  if (diag.inIframe) reasons.push("Открыто в iframe — Chrome не покажет install prompt");
  if (!diag.isSecure) reasons.push("Не HTTPS — PWA install требует secure context");
  if (diag.dismissedActive) reasons.push("Активен dismissed-at (TTL 7 дней)");
  if (diag.platform === "iOS Safari" && !bipFired)
    reasons.push("iOS Safari не поддерживает beforeinstallprompt — нужен ручной путь «Поделиться → На экран „Домой“»");
  if (diag.platform.startsWith("Desktop") && !bipFired && !diag.standalone && !diag.inIframe)
    reasons.push("BIP ещё не сработал — Chrome требует engagement (клик/скролл) и пройденные критерии PWA");

  return (
    <Card className="border-accent/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-accent/15 p-2 text-accent">
              <Activity className="size-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Диагностика PWA
                <Badge variant="outline" className="text-[10px]">live</Badge>
              </CardTitle>
              <CardDescription>
                Почему install-баннер не появляется на конкретном устройстве.
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={onRefresh} className="h-8">
              <RefreshCw className="size-3.5 mr-1.5" />
              Обновить
            </Button>
            <Button size="sm" variant="outline" onClick={copyAll} className="h-8">
              <Copy className="size-3.5 mr-1.5" />
              Копировать
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        <DiagRow
          label="Платформа"
          status="info"
          value={diag.platform}
          hint="Определена по User-Agent"
        />
        <DiagRow
          label="display-mode: standalone"
          status={diag.standalone ? "ok" : "info"}
          value={diag.standalone ? "true (установлено)" : "false"}
          hint={diag.standalone ? "Приложение уже запущено как PWA" : "Открыто в браузерной вкладке"}
        />
        <DiagRow
          label="beforeinstallprompt"
          status={bipFired ? "ok" : diag.platform === "iOS Safari" ? "info" : "warn"}
          value={bipFired ? `fired @ ${fmtTime(bipFiredAt)}` : "не сработал"}
          hint={
            diag.platform === "iOS Safari"
              ? "iOS Safari никогда не вызывает это событие — by design"
              : "Chrome/Edge вызывают это событие при выполнении критериев PWA"
          }
        />
        <DiagRow
          label="appinstalled"
          status={appInstalledAt ? "ok" : "info"}
          value={appInstalledAt ? fmtTime(appInstalledAt) : "—"}
          hint="Срабатывает после успешной установки в этой сессии"
        />
        <DiagRow
          label="dismissed-at (баннер)"
          status={diag.dismissedActive ? "warn" : "ok"}
          value={
            diag.dismissedAt ? (
              <span className="flex items-center gap-2 justify-end">
                {fmtTime(diag.dismissedAt)}
                <button
                  type="button"
                  onClick={clearDismiss}
                  className="text-[10px] underline text-accent hover:opacity-80"
                >
                  очистить
                </button>
              </span>
            ) : (
              "—"
            )
          }
          hint={
            diag.dismissedActive
              ? "Пользователь нажал «Позже» — баннер скрыт на 7 дней"
              : "Не установлен или истёк"
          }
        />
        <DiagRow
          label="iframe"
          status={diag.inIframe ? "bad" : "ok"}
          value={diag.inIframe ? "true" : "false"}
          hint={
            diag.inIframe
              ? "Chrome не показывает install prompt во фреймах — открой основной домен"
              : "Запущено в основном окне"
          }
        />
        <DiagRow
          label="secure context"
          status={diag.isSecure ? "ok" : "bad"}
          value={`${diag.proto}//${diag.host}`}
          hint={diag.isSecure ? "HTTPS — ок" : "PWA install требует HTTPS"}
        />
        <DiagRow
          label="serviceWorker API"
          status={diag.hasSW ? "ok" : "warn"}
          value={diag.hasSW ? "доступен" : "недоступен"}
          hint="Сам SW не зарегистрирован — используются HTTP cache headers"
        />
        <DiagRow label="User-Agent" status="info" value={<span className="text-[10px]">{diag.ua}</span>} />

        {reasons.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
              <AlertCircle className="size-3.5" />
              Возможные причины, почему баннер не появляется
            </div>
            <ul className="ml-5 list-disc space-y-0.5 text-xs text-muted-foreground">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function DownloadsPage() {
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [bipFired, setBipFired] = useState(false);
  const [bipFiredAt, setBipFiredAt] = useState<string | null>(null);
  const [appInstalledAt, setAppInstalledAt] = useState<string | null>(null);
  const [diagTick, setDiagTick] = useState(0);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const env = (import.meta as any).env?.VITE_PUBLIC_SITE_URL as string | undefined;
    return env || window.location.origin;
  }, []);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
      setBipFired(true);
      setBipFiredAt(new Date().toISOString());
    };
    const onInstalled = () => {
      setInstalled(true);
      setAppInstalledAt(new Date().toISOString());
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(publicUrl)}`;

  const handleAndroidApk = () => {
    setBusy("apk");
    window.open(pwaBuilderUrl, "_blank", "noopener,noreferrer");
    toast.success("Открываю PWABuilder", {
      description: "Нажми Package For Stores → Android → Generate. Получишь подписанный .apk и .aab.",
    });
    setTimeout(() => setBusy(null), 1200);
  };

  const handleInstallPwa = async () => {
    if (!installEvt) {
      toast.info("Браузер не предложил установку", {
        description: "Открой сайт в Chrome/Edge на Android или используй кнопку «Скачать APK» ниже.",
      });
      return;
    }
    await installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallEvt(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Downloads</h1>
        <p className="text-sm text-muted-foreground">
          Установи 1inow на телефон и компьютер. Все сборки используют единое лого и тёмную тему.
        </p>
      </header>

      <PwaDiagnostics
        bipFired={bipFired}
        bipFiredAt={bipFiredAt}
        appInstalledAt={appInstalledAt}
        tick={diagTick}
        onRefresh={() => setDiagTick((n) => n + 1)}
      />

      {/* Android APK via PWABuilder */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                <Smartphone className="size-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Android APK
                  <Badge variant="outline" className="text-[10px]">PWABuilder</Badge>
                </CardTitle>
                <CardDescription>
                  Подписанный .apk и .aab без Chrome «Install app». Генерируется за ~30 секунд.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Нажми кнопку — откроется PWABuilder с уже подставленным адресом сайта.</li>
            <li>Сверху справа: <span className="font-medium text-foreground">Package For Stores → Android</span>.</li>
            <li>Выбери <span className="font-medium text-foreground">Test Package</span> (для себя) или <span className="font-medium text-foreground">Production</span>.</li>
            <li>Скачается .zip с .apk внутри — перенеси на телефон и открой.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleAndroidApk} disabled={busy === "apk"}>
              {busy === "apk" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
              Скачать Android APK
            </Button>
            <Button variant="outline" asChild>
              <a href={pwaBuilderUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Открыть PWABuilder
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            URL для упаковки: <code className="rounded bg-muted px-1.5 py-0.5">{publicUrl}</code>
          </p>
        </CardContent>
      </Card>

      {/* PWA install (iOS / Android browser) */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-500">
              <Smartphone className="size-5" />
            </div>
            <div>
              <CardTitle>Установить как PWA</CardTitle>
              <CardDescription>iOS Safari и Android Chrome — Add to Home Screen.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleInstallPwa} disabled={installed}>
              <Download className="mr-2 size-4" />
              {installed ? "Установлено" : "Установить PWA"}
            </Button>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
              <Info className="size-3.5" /> iOS Safari
            </div>
            Поделиться (квадрат со стрелкой) → <span className="font-medium">На экран «Домой»</span> → Добавить.
          </div>
        </CardContent>
      </Card>

      {/* macOS desktop */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-zinc-500/10 p-2 text-zinc-300">
              <Apple className="size-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                macOS Desktop
                <Badge variant="outline" className="text-[10px]">Electron · auto-update</Badge>
              </CardTitle>
              <CardDescription>
                Подписанная сборка с автообновлениями через GitHub Releases.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Сборка и подпись делаются в GitHub Actions — workflow уже добавлен в репозиторий.
            После настройки Apple Developer ID каждый push тега <code className="rounded bg-muted px-1.5 py-0.5">v*</code> публикует
            подписанный и нотаризованный <code className="rounded bg-muted px-1.5 py-0.5">.dmg</code> в Releases,
            и установленное приложение само его подтягивает.
          </p>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <div className="mb-2 font-medium text-foreground">Что нужно один раз положить в GitHub Secrets:</div>
            <ul className="ml-4 list-disc space-y-0.5 text-muted-foreground">
              <li><code>APPLE_ID</code>, <code>APPLE_APP_SPECIFIC_PASSWORD</code>, <code>APPLE_TEAM_ID</code></li>
              <li><code>CSC_LINK</code> (base64 от .p12 сертификата Developer ID Application)</li>
              <li><code>CSC_KEY_PASSWORD</code> (пароль .p12)</li>
              <li><code>GH_TOKEN</code> создаётся автоматически</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Подробности: <code className="rounded bg-muted px-1.5 py-0.5">desktop/README.md</code> в репозитории.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
