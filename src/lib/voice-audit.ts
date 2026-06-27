import type { VoicePlan } from "@/lib/voice-actions";
import { logWorkspaceActivity } from "@/lib/activity-log";
import { supabase } from "@/integrations/supabase/client";

export type VoiceAuditOutcome = "executed" | "failed" | "queued" | "cancelled";

export async function logVoiceAction(
  plan: VoicePlan,
  outcome: VoiceAuditOutcome,
  extra?: Record<string, unknown>,
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    await logWorkspaceActivity({
      userId,
      action: `voice.${plan.intent}.${outcome}`,
      entityType: "voice_command",
      entityId: plan.entityId ?? plan.inboxItemId ?? null,
      projectId: plan.projectId ?? null,
      metadata: {
        intent: plan.intent,
        label: plan.label,
        summary: plan.summary,
        confidence: plan.confidence,
        destructive: plan.destructive ?? false,
        outcome,
        ...extra,
      },
    });
  } catch (err) {
    console.warn("[voice-audit]", err);
  }
}
