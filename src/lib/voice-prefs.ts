const STORAGE_KEY = "dios.voice.user";

export type VoicePrefs = {
  speakerOn: boolean;
  /** 0..1 normalized volume for TTS */
  outputVolume: number;
  /** Hands-free: one tap keeps the mic session alive between turns */
  conversationMode?: boolean;
  /** Auto-submit after the user finishes speaking */
  autoSend?: boolean;
  autoSendDelayMs?: number;
  /** Auto-run high-confidence voice commands after brief pause */
  autoExecute?: boolean;
  sttLang?: string;
  /** 0..200 percent mic gain applied in Web Audio */
  inputGain?: number;
  /** 0..1 activation threshold for mic meters */
  threshold?: number;
  /** Push-to-talk key code (e.g. KeyV, Space) */
  pttKey?: string;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  /** Speak Nova and Vera with distinct voices when structured */
  dualPersonaTts?: boolean;
  /** Proactive workspace hints in voice UI */
  ambientSense?: boolean;
  wakePhraseEnabled?: boolean;
  wakePhrase?: string;
  /** auto = browser when available; server = Whisper via /api/stt */
  sttMode?: "auto" | "browser" | "server";
  /** Prefetch next TTS chunk while the current one plays */
  streamingTts?: boolean;
};

const DEFAULTS: VoicePrefs = {
  speakerOn: true,
  outputVolume: 0.8,
  conversationMode: true,
  autoSend: true,
  autoSendDelayMs: 850,
  autoExecute: true,
  inputGain: 100,
  threshold: 0.08,
  pttKey: "KeyV",
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  dualPersonaTts: true,
  ambientSense: true,
  wakePhraseEnabled: false,
  wakePhrase: "hey sense",
  sttMode: "auto",
  streamingTts: true,
};

/** Normalize legacy admin page values (0–100 volume, etc.). */
export function normalizeVoicePrefs(raw: Partial<VoicePrefs>): VoicePrefs {
  const merged = { ...DEFAULTS, ...raw };
  let outputVolume = merged.outputVolume ?? DEFAULTS.outputVolume;
  if (outputVolume > 1) outputVolume = outputVolume / 100;
  outputVolume = Math.min(1, Math.max(0, outputVolume));

  let inputGain = merged.inputGain ?? DEFAULTS.inputGain ?? 100;
  inputGain = Math.min(200, Math.max(0, inputGain));

  let threshold = merged.threshold ?? DEFAULTS.threshold ?? 0.08;
  if (threshold > 1) threshold = threshold / 100;
  threshold = Math.min(0.5, Math.max(0.02, threshold));

  const sttMode =
    merged.sttMode === "browser" || merged.sttMode === "server" || merged.sttMode === "auto"
      ? merged.sttMode
      : DEFAULTS.sttMode;

  return { ...merged, outputVolume, inputGain, threshold, sttMode };
}

export function loadVoicePrefs(): VoicePrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return normalizeVoicePrefs(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
}

export function saveVoicePrefs(patch: Partial<VoicePrefs>) {
  if (typeof window === "undefined") return DEFAULTS;
  const next = normalizeVoicePrefs({ ...loadVoicePrefs(), ...patch });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
