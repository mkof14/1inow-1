const STORAGE_KEY = "1inow:voice:global:v1";

export type VoiceGlobalSettings = {
  enabled: boolean;
  sttLang?: string;
};

const DEFAULTS: VoiceGlobalSettings = { enabled: true };

export function loadVoiceGlobalSettings(): VoiceGlobalSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveVoiceGlobalSettings(patch: Partial<VoiceGlobalSettings>) {
  if (typeof window === "undefined") return DEFAULTS;
  const next = { ...loadVoiceGlobalSettings(), ...patch };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** Called from admin voice page when system settings load. */
export function syncVoiceGlobalFromAdmin(settings: Record<string, unknown>) {
  saveVoiceGlobalSettings({
    enabled: settings["voice.enabled"] !== false && settings["voice.enabled"] !== "false",
    sttLang: typeof settings["voice.default_stt_lang"] === "string" ? settings["voice.default_stt_lang"] : undefined,
  });
}
