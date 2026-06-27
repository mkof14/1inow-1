/** Merge cloud assistant + admin voice settings into local runtime prefs. */

import { fetchSystemSettings } from "@/lib/admin-queries";
import { saveVoicePrefs, type VoicePrefs } from "@/lib/voice-prefs";
import { syncVoiceGlobalFromAdmin } from "@/lib/voice-global-settings";
import { setAssistantMemoryEnabled } from "@/lib/voice-learning";
import { supabase } from "@/integrations/supabase/client";

export async function hydrateVoicePrefsFromCloud(userId: string): Promise<Partial<VoicePrefs>> {
  const patch: Partial<VoicePrefs> = {};

  try {
    const [{ data: assistant }, settings] = await Promise.all([
      supabase
        .from("assistant_preferences")
        .select("memory_enabled, proactive_level, notification_level")
        .eq("user_id", userId)
        .maybeSingle(),
      fetchSystemSettings().catch(() => [] as Awaited<ReturnType<typeof fetchSystemSettings>>),
    ]);

    if (assistant) {
      setAssistantMemoryEnabled(assistant.memory_enabled ?? true);
      if (typeof assistant.proactive_level === "number") {
        patch.ambientSense = assistant.proactive_level >= 2;
      }
    }

    const map: Record<string, unknown> = {};
    for (const row of settings ?? []) {
      if (row?.key) map[row.key] = row.value;
    }
    syncVoiceGlobalFromAdmin(map);

    const defaultSttLang = map["voice.default_stt_lang"];
    if (typeof defaultSttLang === "string" && defaultSttLang.trim()) {
      patch.sttLang = defaultSttLang.trim();
    }

    const defaultSttMode = map["voice.default_stt_mode"];
    if (defaultSttMode === "browser" || defaultSttMode === "server" || defaultSttMode === "auto") {
      patch.sttMode = defaultSttMode;
    }

    if (Object.keys(patch).length > 0) {
      saveVoicePrefs(patch);
    }
  } catch (error) {
    console.warn("[voice] hydrate prefs failed", error);
  }

  return patch;
}
