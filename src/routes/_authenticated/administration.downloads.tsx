import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Apple, Smartphone, Download, ExternalLink, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/administration/downloads")({
  component: DownloadsPage,
});

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function DownloadsPage() {
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const env = (import.meta as any).env?.VITE_PUBLIC_SITE_URL as string | undefined;
    return env || window.location.origin;
  }, []);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
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