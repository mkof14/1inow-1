import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

/** Attach the profile to the default workspace organization when missing. */
export async function ensureProfileOrganization(userId: string) {
  const { data, error } = await supabase.rpc("ensure_profile_organization", {
    _user_id: userId,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** Resolve organization id for the current user, bootstrapping when needed. */
export async function resolveActiveOrganizationId(userId: string) {
  const scope = await fetchProfileWorkspaceScope(userId);
  if (scope.organizationId) return scope.organizationId;

  return ensureProfileOrganization(userId);
}

/** Profiles visible in the current user's workspace organization. */
export async function fetchWorkspaceProfiles(columns = "*"): Promise<ProfileRow[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign in required");

  const organizationId = await resolveActiveOrganizationId(authData.user.id);
  let query = supabase.from("profiles").select(columns).order("full_name", { ascending: true });

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ProfileRow[];
}

/** Resolve the current user's organization context from profile scope. */
export async function fetchCurrentOrganizationContext(userId: string) {
  const organizationId = await resolveActiveOrganizationId(userId);
  const scope = await fetchProfileWorkspaceScope(userId);

  if (!organizationId) {
    return { scope, organization: null as OrganizationSummary | null };
  }

  const organization = await fetchOrganizationSummary(organizationId);
  return { scope: { ...scope, organizationId }, organization };
}
