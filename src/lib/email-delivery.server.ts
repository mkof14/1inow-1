import process from "node:process";

export type InvitationEmailState = {
  enabled: boolean;
  connected: boolean;
  status: "disabled" | "not_configured" | "ready";
  message: string;
  missingSecrets: string[];
};

export function getInvitationEmailState(): InvitationEmailState {
  const enabled = process.env.ENABLE_INVITATION_EMAIL === "true";
  const missingSecrets = ["RESEND_API_KEY", "RESEND_FROM_EMAIL"].filter(
    (name) => !process.env[name]?.trim(),
  );
  const connected = enabled && missingSecrets.length === 0;

  return {
    enabled,
    connected,
    status: !enabled ? "disabled" : connected ? "ready" : "not_configured",
    message: !enabled
      ? "Invitation email delivery is disabled. Set ENABLE_INVITATION_EMAIL=true when Resend is configured."
      : connected
        ? "Resend is configured for invitation emails."
        : "Invitation email delivery is enabled but Resend secrets are missing.",
    missingSecrets: enabled ? missingSecrets : [],
  };
}

export async function sendViaResend(input: {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
}) {
  const state = getInvitationEmailState();
  if (!state.connected) {
    throw new Error(state.message);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text ?? undefined,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error (${response.status}): ${body || response.statusText}`);
  }

  return response.json() as Promise<{ id?: string }>;
}
