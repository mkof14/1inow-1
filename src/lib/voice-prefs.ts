const STORAGE_KEY = "dios.voice.user";

export type VoicePrefs = {
  speakerOn: boolean;
  outputVolume: number;
  sttLang?: string;
  inputGain?: number;
  threshold?: number;
};

const DEFAULTS: VoicePrefs = {
  speakerOn: true,
  outputVolume: 1,
};

export function loadVoicePrefs(): VoicePrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveVoicePrefs(patch: Partial<VoicePrefs>) {
  if (typeof window === "undefined") return;
  const next = { ...loadVoicePrefs(), ...patch };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
