import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MicIndicator } from "@/components/voice/mic-indicator";
import { Mic, Volume2, Keyboard, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemSettingsQuery, updateSystemSetting } from "@/lib/admin-queries";
import { useI18n } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const Route = createFileRoute("/_authenticated/administration/voice")({
  component: VoicePage,
});

const LS_KEY = "dios.voice.user";
type UserVoicePrefs = {
  inputGain: number;       // 0..200
  outputVolume: number;    // 0..100
  threshold: number;       // 0..1
  pttKey: string;          // hotkey
  sttLang: string;
  ttsVoice: string;
  autoSend: boolean;
};
const defaults: UserVoicePrefs = {
  inputGain: 100, outputVolume: 80, threshold: 0.08,
  pttKey: "Space", sttLang: "en", ttsVoice: "default", autoSend: false,
};

function loadUserPrefs(): UserVoicePrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}

function VoicePage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: settings = [] } = useQuery(systemSettingsQuery);

  const getSetting = (key: string, fb: unknown) =>
    settings.find((s) => s.key === key)?.value ?? fb;

  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [requirePermission, setRequirePermission] = useState(true);
  const [defaultSttLang, setDefaultSttLang] = useState("en");

  useEffect(() => {
    setGlobalEnabled(Boolean(getSetting("voice.enabled", true)));
    setRequirePermission(Boolean(getSetting("voice.require_permission", true)));
    setDefaultSttLang(String(getSetting("voice.default_stt_lang", "en")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.length]);

  const [prefs, setPrefs] = useState<UserVoicePrefs>(loadUserPrefs);
  const [recording, setRecording] = useState(false);

  const update = useMutation({
    mutationFn: (p: { key: string; value: unknown }) => updateSystemSetting(p.key, p.value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "system-settings"] });
      toast.success("Global voice setting saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveUser = () => {
    window.localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    toast.success("Voice preferences saved");
  };

  // PTT key capture
  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.code || e.key;
      setPrefs((p) => ({ ...p, pttKey: key }));
      setRecording(false);
    };
    window.addEventListener("keydown", onKey, { once: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [recording]);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Voice Controls</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Professional microphone, speech, and text-to-speech configuration. Global settings apply org-wide.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="size-4 text-accent" /> Live microphone test
          </CardTitle>
          <CardDescription>Real-time audio level using the Web Audio API.</CardDescription>
        </CardHeader>
        <CardContent>
          <MicIndicator bars={24} threshold={prefs.threshold} />
          <p className="text-xs text-muted-foreground mt-3">
            Speak into your mic. Bars turn accent-colored when input exceeds the activation threshold.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global voice (admin)</CardTitle>
          <CardDescription>Applied to all users in the workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable voice features</Label>
              <p className="text-xs text-muted-foreground">Master switch for STT, TTS and voice commands.</p>
            </div>
            <Switch
              checked={globalEnabled}
              onCheckedChange={(v) => { setGlobalEnabled(v); update.mutate({ key: "voice.enabled", value: v }); }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Require explicit permission</Label>
              <p className="text-xs text-muted-foreground">Prompt each user before activating microphone.</p>
            </div>
            <Switch
              checked={requirePermission}
              onCheckedChange={(v) => { setRequirePermission(v); update.mutate({ key: "voice.require_permission", value: v }); }}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Default STT language</Label>
              <Select
                value={defaultSttLang}
                onValueChange={(v) => { setDefaultSttLang(v); update.mutate({ key: "voice.default_stt_lang", value: v }); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(dictionaries).map((c) => (
                    <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your preferences</CardTitle>
          <CardDescription>Stored on this device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="flex items-center justify-between">
              <span>Input gain</span>
              <span className="tabular-nums text-muted-foreground">{prefs.inputGain}%</span>
            </Label>
            <Slider
              value={[prefs.inputGain]} min={0} max={200} step={5}
              onValueChange={([v]) => setPrefs((p) => ({ ...p, inputGain: v }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="flex items-center justify-between">
              <span><Volume2 className="size-3.5 inline mr-1" />Output volume</span>
              <span className="tabular-nums text-muted-foreground">{prefs.outputVolume}%</span>
            </Label>
            <Slider
              value={[prefs.outputVolume]} min={0} max={100} step={5}
              onValueChange={([v]) => setPrefs((p) => ({ ...p, outputVolume: v }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="flex items-center justify-between">
              <span>Activation threshold</span>
              <span className="tabular-nums text-muted-foreground">{Math.round(prefs.threshold * 100)}%</span>
            </Label>
            <Slider
              value={[prefs.threshold * 100]} min={0} max={50} step={1}
              onValueChange={([v]) => setPrefs((p) => ({ ...p, threshold: v / 100 }))}
              className="mt-2"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Speech recognition language</Label>
              <Select value={prefs.sttLang} onValueChange={(v) => setPrefs((p) => ({ ...p, sttLang: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(dictionaries).map((c) => (
                    <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>TTS voice</Label>
              <Input
                value={prefs.ttsVoice}
                onChange={(e) => setPrefs((p) => ({ ...p, ttsVoice: e.target.value }))}
                placeholder="default"
              />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="flex items-center gap-1"><Keyboard className="size-3.5" />Push-to-talk key</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded border bg-muted px-2 py-1 text-xs font-mono">{prefs.pttKey}</code>
                <Button type="button" variant="outline" size="sm" onClick={() => setRecording(true)} disabled={recording}>
                  {recording ? "Press any key…" : "Change"}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={prefs.autoSend}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, autoSend: v }))}
                id="autosend"
              />
              <Label htmlFor="autosend">Auto-send on silence</Label>
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={saveUser} className="gap-2">
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TODO: Wire STT/TTS engine (Web Speech API or server-side via Lovable AI Gateway) once provider is chosen. */}
    </div>
  );
}