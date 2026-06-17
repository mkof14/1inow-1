import { createServerFn } from "@tanstack/react-start";

const OWNER_EMAIL = "dnainform@gmail.com";

/**
 * Dev-only: issues a magic-link sign-in for the workspace owner.
 * Hard-coded to a single email. Ensures the user exists and has super_admin.
 */
export const devOwnerMagicLink = createServerFn({ method: "POST" })
  .inputValidator((data: { origin?: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // 1. Find or create the user
    let userId: string | undefined;
    const { data: list, error: listErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw new Error(listErr.message);
    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === OWNER_EMAIL,
    );
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: OWNER_EMAIL,
          email_confirm: true,
          user_metadata: { full_name: "Owner" },
        });
      if (createErr) throw new Error(createErr.message);
      userId = created.user?.id;
    }
    if (!userId) throw new Error("Could not resolve owner user id");

    // 2. Make sure they have super_admin
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "super_admin" as never },
        { onConflict: "user_id,role" },
      );

    // 3. Issue a magic link
    const origin = data?.origin ?? "";
    const { data: link, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: OWNER_EMAIL,
        options: origin ? { redirectTo: `${origin}/dashboard` } : undefined,
      });
    if (linkErr) throw new Error(linkErr.message);
    const actionLink = link.properties?.action_link;
    if (!actionLink) throw new Error("No action link returned");
    return { actionLink };
  });