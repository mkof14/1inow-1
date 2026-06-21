import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MicIndicator } from "@/components/voice/mic-indicator";
import { Mic, Volume2, Keyboard, Save, Loader2, Play, Square, Radio, Wand2, Activity } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSystemSettings, updateSystemSetting, type SystemSetting } from "@/lib/admin-queries";
import { useI18n } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

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

const TTS_VOICES = [
  { id: "alloy", label: "Alloy — neutral" },
  { id: "ash", label: "Ash — calm" },
  { id: "ballad", label: "Ballad — warm" },
  { id: "coral", label: "Coral — bright" },
  { id: "echo", label: "Echo — soft male" },
  { id: "fable", label: "Fable — expressive" },
  { id: "onyx", label: "Onyx — deep male" },
  { id: "nova", label: "Nova — energetic female" },
  { id: "sage", label: "Sage — clear female" },
  { id: "shimmer", label: "Shimmer — warm female" },
  { id: "verse", label: "Verse — narrator" },
];

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
  const { data: settings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["admin", "system-settings"],
    queryFn: fetchSystemSettings,
  });

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

  // --- Mic calibration (auto noise-floor based threshold) ---
  const [calibrating, setCalibrating] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0); // 0..1
  const [noiseFloor, setNoiseFloor] = useState<number | null>(null);
  const calibSamplesRef = useRef<number[]>([]);
  const calibEndRef = useRef<number>(0);
  const liveLevelRef = useRef(0);

  const CALIB_MS = 3000;

  const startCalibration = () => {
    calibSamplesRef.current = [];
    calibEndRef.current = performance.now() + CALIB_MS;
    setCalibProgress(0);
    setNoiseFloor(null);
    setCalibrating(true);
    toast.message("Calibrating — stay quiet for 3 seconds");

    const tick = () => {
      const now = performance.now();
      const remaining = calibEndRef.current - now;
      if (remaining <= 0) {
        const samples = calibSamplesRef.current;
        if (samples.length < 5) {
          setCalibrating(false);
          toast.error("No mic signal — start the mic test first");
          return;
        }
        // robust noise floor: 90th percentile of ambient samples
        const sorted = [...samples].sort((a, b) => a - b);
        const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
        const peak = sorted[sorted.length - 1] ?? 0;
        const floor = Math.max(p90, 0.005);
        // threshold = noise floor + 60% headroom, clamped 2%..50%
        const recommended = Math.min(0.5, Math.max(0.02, floor * 1.6 + 0.02));
        setNoiseFloor(floor);
        setPrefs((p) => ({ ...p, threshold: Number(recommended.toFixed(3)) }));
        setCalibrating(false);
        setCalibProgress(1);
        toast.success(
          `Threshold set to ${Math.round(recommended * 100)}% (noise floor ${Math.round(
            floor * 100,
          )}%, peak ${Math.round(peak * 100)}%)`,
        );
        return;
      }
      calibSamplesRef.current.push(liveLevelRef.current);
      setCalibProgress(1 - remaining / CALIB_MS);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // --- TTS test ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsText, setTtsText] = useState("Hello! This is a voice test from 1inow.");
  const [ttsBusy, setTtsBusy] = useState(false);

  const playTts = async () => {
    setTtsBusy(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ttsText,
          voice: prefs.ttsVoice && prefs.ttsVoice !== "default" ? prefs.ttsVoice : "alloy",
        }),
      });
      if (!res.ok) throw new Error(await res.text() || `TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = audioRef.current ?? new Audio();
      audioRef.current = a;
      a.src = url;
      a.volume = prefs.outputVolume / 100;
      await a.play();
      toast.success("Playing voice sample");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "TTS failed");
    } finally {
      setTtsBusy(false);
    }
  };

  // --- STT test ---
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [sttRecording, setSttRecording] = useState(false);
  const [sttBusy, setSttBusy] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startStt = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType =
        ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ||
        "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 1024) {
          toast.error("Recording too short — try again");
          return;
        }
        setSttBusy(true);
        try {
          const fd = new FormData();
          fd.append("file", blob, `rec.${(mr.mimeType || "webm").includes("mp4") ? "mp4" : "webm"}`);
          if (/^[a-z]{2}$/i.test(prefs.sttLang)) fd.append("language", prefs.sttLang);
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          if (!res.ok) throw new Error(await res.text() || `STT ${res.status}`);
          const data = (await res.json()) as { text: string };
          setTranscript(data.text || "(empty)");
          toast.success("Transcribed");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "STT failed");
        } finally {
          setSttBusy(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setSttRecording(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Microphone unavailable");
    }
  };

  const stopStt = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setSttRecording(false);
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRef.current?.state === "recording" && mediaRef.current.stop();
  }, []);

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
        <CardContent className="space-y-4">
          <MicIndicator
            bars={24}
            threshold={prefs.threshold}
            onLevel={(lvl) => { liveLevelRef.current = lvl; }}
          />
          <p className="text-xs text-muted-foreground">
            Speak into your mic. Bars turn accent-colored when input exceeds the activation threshold.
          </p>

          <div className="rounded-md border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <Activity className="size-4 text-accent" /> Auto calibration
                </div>
                <div className="text-xs text-muted-foreground">
                  Measures ambient noise for 3 seconds, then sets a safe activation threshold.
                </div>
              </div>
              <Button
                size="sm"
                variant={calibrating ? "secondary" : "default"}
                disabled={calibrating}
                onClick={startCalibration}
                className="gap-2 shrink-0"
              >
                {calibrating ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
                {calibrating ? "Listening…" : "Calibrate"}
              </Button>
            </div>

            {calibrating && (
              <div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-accent transition-[width] duration-100"
                    style={{ width: `${Math.round(calibProgress * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Stay quiet — sampling ambient noise…
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-background/60 px-2 py-1.5">
                <div className="text-muted-foreground">Noise floor</div>
                <div className="font-mono tabular-nums">
                  {noiseFloor != null ? `${Math.round(noiseFloor * 100)}%` : "—"}
                </div>
              </div>
              <div className="rounded bg-background/60 px-2 py-1.5">
                <div className="text-muted-foreground">Threshold</div>
                <div className="font-mono tabular-nums">{Math.round(prefs.threshold * 100)}%</div>
              </div>
              <div className="rounded bg-background/60 px-2 py-1.5">
                <div className="text-muted-foreground">Headroom</div>
                <div className="font-mono tabular-nums">
                  {noiseFloor != null
                    ? `${Math.round(Math.max(0, prefs.threshold - noiseFloor) * 100)}%`
                    : "—"}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: start the Live mic test first, then click Calibrate and stay quiet. The new threshold is saved with your preferences.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="size-4 text-accent" /> Text-to-speech test
          </CardTitle>
          <CardDescription>Synthesize speech after a voice provider is connected.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            rows={3}
            placeholder="Type any text in any language…"
          />
          <div className="flex items-center gap-2">
            <Button onClick={playTts} disabled={ttsBusy || !ttsText.trim()} className="gap-2">
              {ttsBusy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              Speak
            </Button>
            <span className="text-xs text-muted-foreground">
              Voice: <code className="font-mono">{prefs.ttsVoice || "alloy"}</code> · Volume {prefs.outputVolume}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="size-4 text-accent" /> Speech-to-text test
          </CardTitle>
          <CardDescription>Record a short clip and transcribe it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {!sttRecording ? (
              <Button onClick={startStt} disabled={sttBusy} className="gap-2">
                <Mic className="size-4" /> Start recording
              </Button>
            ) : (
              <Button onClick={stopStt} variant="destructive" className="gap-2">
                <Square className="size-4" /> Stop & transcribe
              </Button>
            )}
            {sttBusy && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Transcribing…
              </span>
            )}
          </div>
          {transcript && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {transcript}
            </div>
          )}
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
              <Select
                value={prefs.ttsVoice || "alloy"}
                onValueChange={(v) => setPrefs((p) => ({ ...p, ttsVoice: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TTS_VOICES.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
