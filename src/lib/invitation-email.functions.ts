import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getInvitationEmailState, sendViaResend } from "@/lib/email-delivery.server";

type SendInvitationEmailInput = {
  template_slug: string;
  language?: string;
  recipient_email: string;
  module?: string;
  variables: Record<string, unknown>;
};

function renderTemplate(tpl: string, vars: Record<string, unknown>) {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{{${key}}}`,
  );
}

async function assertInvitePermission(
  userId: string,
  supabase: {
    rpc: (
      fn: "has_permission",
      args: { _user_id: string; _permission_key: string },
    ) => PromiseLike<{ data: boolean | null; error: Error | null }>;
  },
) {
  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: userId,
    _permission_key: "invite_users",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Missing permission: invite_users");
}

export const sendInvitationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: SendInvitationEmailInput) => data)
  .handler(async ({ data, context }) => {
    await assertInvitePermission(context.userId, context.supabase);

    const { data: tpls, error: tplError } = await context.supabase
      .from("email_templates" as never)
      .select("subject,body_html,body_text")
      .eq("slug", data.template_slug)
      .eq("language", data.language ?? "en")
      .limit(1);
    if (tplError) throw new Error(tplError.message);

    const tpl = (tpls?.[0] ?? {}) as {
      subject?: string;
      body_html?: string;
      body_text?: string | null;
    };
    const subject = tpl.subject
      ? renderTemplate(tpl.subject, data.variables)
      : "You're invited to 1inow";
    const body_html = tpl.body_html ? renderTemplate(tpl.body_html, data.variables) : null;
    const body_text = tpl.body_text ? renderTemplate(tpl.body_text, data.variables) : null;

    const emailState = getInvitationEmailState();
    if (!emailState.connected) {
      const { error: logError } = await context.supabase.from("email_logs" as never).insert({
        template_slug: data.template_slug,
        language: data.language ?? "en",
        recipient_email: data.recipient_email,
        subject,
        body_html,
        status: "queued",
        module: data.module ?? "invitations",
        variables: data.variables,
        error_message: emailState.message,
      } as never);
      if (logError) throw new Error(logError.message);

      return { sent: false as const, reason: emailState.message };
    }

    if (!body_html) {
      throw new Error("Invitation email template is missing body_html");
    }

    const delivery = await sendViaResend({
      to: data.recipient_email,
      subject,
      html: body_html,
      text: body_text,
    });

    const { error: logError } = await context.supabase.from("email_logs" as never).insert({
      template_slug: data.template_slug,
      language: data.language ?? "en",
      recipient_email: data.recipient_email,
      subject,
      body_html,
      status: "sent",
      module: data.module ?? "invitations",
      variables: { ...data.variables, resend_id: delivery.id ?? null },
      sent_at: new Date().toISOString(),
    } as never);
    if (logError) throw new Error(logError.message);

    return { sent: true as const, providerId: delivery.id ?? null };
  });
