import { supabase } from "@/integrations/supabase/client";

export type ProfileWorkspaceScope = {
  organizationId: string | null;
  departmentId: string | null;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

/** Read the user's workspace placement from profiles. */
export async function fetchProfileWorkspaceScope(userId: string): Promise<ProfileWorkspaceScope> {
  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id, department_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return {
    organizationId: data?.organization_id ?? null,
    departmentId: data?.department_id ?? null,
  };
}

/** Load organization metadata when the profile is linked to a workspace. */
export async function fetchOrganizationSummary(
  organizationId: string,
): Promise<OrganizationSummary | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data;
}

/** Resolve the current user's organization context from profile scope. */
export async function fetchCurrentOrganizationContext(userId: string) {
  const scope = await fetchProfileWorkspaceScope(userId);
  if (!scope.organizationId) {
    return { scope, organization: null as OrganizationSummary | null };
  }

  const organization = await fetchOrganizationSummary(scope.organizationId);
  return { scope, organization };
}
