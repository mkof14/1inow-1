import process from "node:process";

type LogAiActionInput = {
  userId: string;
  kind: string;
  prompt?: string | null;
  result?: Record<string, unknown> | null;
  status?: string;
  payload?: Record<string, unknown>;
  sources?: unknown[];
};

async function resolveServerOrganizationId(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[ai-audit] organization lookup failed", error.message);
    return null;
  }
  return data?.organization_id ?? null;
}

export async function logAiAction(input: LogAiActionInput) {
  if (process.env.AI_AUDIT_LOGGING_ENABLED === "false") return;

  try {
    const organizationId = await resolveServerOrganizationId(input.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_actions").insert({
      user_id: input.userId,
      organization_id: organizationId,
      kind: input.kind,
      prompt: input.prompt?.slice(0, 4000) ?? null,
      result: input.result ?? null,
      status: input.status ?? "completed",
      payload: input.payload ?? {},
      sources: input.sources ?? [],
    } as never);
  } catch (error) {
    console.error("[ai-audit] insert failed", error);
  }
}
