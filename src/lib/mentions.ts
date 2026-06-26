import { deliverInAppNotification } from "@/lib/notifications";
import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { supabase } from "@/integrations/supabase/client";

function normalizeHandle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function extractMentionHandles(body: string) {
  const matches = body.match(/@([a-zA-Z0-9][a-zA-Z0-9._-]{1,48})/g) ?? [];
  return [...new Set(matches.map((token) => token.slice(1)))];
}

export async function notifyMessageMentions(input: {
  body: string;
  authorId: string;
  messageId: string;
  channelId: string;
  url?: string;
}) {
  const handles = extractMentionHandles(input.body);
  if (handles.length === 0) return;

  const organizationId = await resolveActiveOrganizationId(input.authorId).catch(() => null);
  let query = supabase.from("profiles").select("id, full_name, email");
  if (organizationId) query = query.eq("organization_id", organizationId);

  const { data: profiles, error } = await query;
  if (error) throw error;

  const recipients = new Set<string>();
  for (const handle of handles) {
    const normalized = normalizeHandle(handle);
    const match = (profiles ?? []).find((profile) => {
      const nameHandle = normalizeHandle(profile.full_name ?? "");
      const emailHandle = normalizeHandle((profile.email ?? "").split("@")[0] ?? "");
      return normalized === nameHandle || normalized === emailHandle;
    });
    if (match?.id && match.id !== input.authorId) recipients.add(match.id);
  }

  await Promise.all(
    Array.from(recipients).map((userId) =>
      deliverInAppNotification({
        userId,
        type: "mention",
        title: "You were mentioned",
        body: input.body.slice(0, 160),
        actorId: input.authorId,
        entityType: "message",
        entityId: input.messageId,
        url: input.url ?? "/communication",
      }).catch(() => undefined),
    ),
  );
}
