import { sendInvitationEmail } from "@/lib/invitation-email.functions";
import { logEmail, type AppRole, ROLE_LABELS } from "@/lib/admin-queries";

export type InvitationEmailVariables = {
  recipient_name: string;
  inviter_name: string;
  organization_name: string;
  role: string;
  accept_url: string;
  expires_at: string;
};

export function buildInvitationEmailVariables(input: {
  email: string;
  fullName?: string;
  role: AppRole;
  token: string;
  organizationName?: string;
  inviterName?: string;
  expiresAt?: string;
}): InvitationEmailVariables {
  return {
    recipient_name: input.fullName || input.email,
    inviter_name: input.inviterName ?? "Administrator",
    organization_name: input.organizationName ?? "1inow",
    role: ROLE_LABELS[input.role] ?? input.role,
    accept_url: `${typeof window !== "undefined" ? window.location.origin : ""}/auth?invite=${input.token}`,
    expires_at: input.expiresAt ?? new Date(Date.now() + 14 * 86400_000).toLocaleDateString(),
  };
}

/** Send invitation email via server when Resend is enabled, otherwise queue a dev log entry. */
export async function dispatchInvitationEmail(input: {
  template_slug: string;
  language?: string;
  recipient_email: string;
  variables: InvitationEmailVariables;
}) {
  try {
    const result = await sendInvitationEmail({ data: input });
    if (result.sent) {
      return { sent: true as const, providerId: result.providerId };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation email failed";
    await logEmail({
      template_slug: input.template_slug,
      language: input.language,
      recipient_email: input.recipient_email,
      module: "invitations",
      variables: input.variables,
    });
    return { sent: false as const, reason: message };
  }

  await logEmail({
    template_slug: input.template_slug,
    language: input.language,
    recipient_email: input.recipient_email,
    module: "invitations",
    variables: input.variables,
  });
  return {
    sent: false as const,
    reason: "Invitation email delivery is disabled in this environment",
  };
}
