import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, type AppRole } from "@/lib/admin-queries";
import { ensureCurrentProfile } from "@/lib/profile-bootstrap";
import { deliverInAppNotification } from "@/lib/notifications";

export const INVITE_TOKEN_STORAGE_KEY = "1inow-pending-invite-token";

export type InvitationPreview = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  organization_name: string | null;
  custom_message: string | null;
  expires_at: string;
  status: string;
};

export function persistInviteToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);
}

export function readInviteToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
}

export function clearInviteToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
}

export function invitationRoleLabel(role: AppRole) {
  return ROLE_LABELS[role] ?? role;
}

export async function fetchInvitationPreview(token: string): Promise<InvitationPreview | null> {
  const { data, error } = await supabase.rpc("get_invitation_preview", { _token: token });
  if (error) throw error;
  if (!data || typeof data !== "object") return null;
  return data as InvitationPreview;
}

export async function acceptInvitation(token: string) {
  const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
  if (error) throw error;
  const invitationId = data as string;

  const [{ data: inv }, { data: authData }] = await Promise.all([
    supabase
      .from("invitations")
      .select("invited_by, email, full_name")
      .eq("id", invitationId)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const actorId = authData.user?.id ?? null;
  if (inv?.invited_by && actorId && inv.invited_by !== actorId) {
    await deliverInAppNotification({
      userId: inv.invited_by,
      type: "system",
      title: "Invitation accepted",
      body: inv.full_name?.trim() || inv.email,
      actorId,
      entityType: "invitation",
      entityId: invitationId,
      url: "/administration/invitations",
    }).catch(() => undefined);
  }

  return invitationId;
}

export async function completeAuthenticatedInvite(user: User, token?: string | null) {
  await ensureCurrentProfile(user);
  const inviteToken = token?.trim() || readInviteToken();
  if (!inviteToken) return null;
  const invitationId = await acceptInvitation(inviteToken);
  clearInviteToken();
  return invitationId;
}
