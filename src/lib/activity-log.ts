import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { supabase } from "@/integrations/supabase/client";

export async function logWorkspaceActivity(input: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const organizationId = await resolveActiveOrganizationId(input.userId).catch(() => null);

  const { error } = await supabase.from("activity_logs").insert({
    user_id: input.userId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    project_id: input.projectId ?? null,
    organization_id: organizationId,
    metadata: (input.metadata ?? {}) as never,
  });

  if (error) {
    console.warn("[activity-log]", error.message);
  }
}
