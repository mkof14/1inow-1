import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getServerConfig, requireDevOwnerToolsEnabled } from "@/lib/config.server";

type AppRole =
  | "super_admin"
  | "admin"
  | "ceo"
  | "project_manager"
  | "team_lead"
  | "employee"
  | "contractor"
  | "client"
  | "investor"
  | "guest";

async function assertOwner(userId: string) {
  const config = getServerConfig();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) throw new Error(error.message);
  const email = data.user?.email?.toLowerCase();
  if (email !== config.founderEmail) {
    throw new Error("Forbidden: dev tools are owner-only");
  }
  return { supabaseAdmin, email };
}

/** Replace the caller's role rows with a single chosen role. Owner-only. */
export const setSelfRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { role: AppRole }) => data)
  .handler(async ({ data, context }) => {
    requireDevOwnerToolsEnabled();
    const { supabaseAdmin } = await assertOwner(context.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", context.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: data.role } as never);
    if (error) throw new Error(error.message);
    return { ok: true, role: data.role };
  });

/** Wipe demo content. Owner-only. Restores owner's super_admin role. */
export const resetDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireDevOwnerToolsEnabled();
    const { supabaseAdmin } = await assertOwner(context.userId);
    const tables = [
      "message_reactions",
      "message_read_receipts",
      "message_translations",
      "saved_messages",
      "messages",
      "channel_members",
      "channels",
      "tasks",
      "project_members",
      "decision_approvals",
      "decisions",
      "projects",
      "notifications",
      "activity_logs",
      "ai_action_approvals",
      "ai_actions",
      "ai_questions",
      "ai_reminders",
      "favorites",
      "recent_items",
    ] as const;
    for (const t of tables) {
      // never-matching id → effectively DELETE *
      const { error } = await supabaseAdmin
        .from(t)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) console.warn(`[reset] ${t}: ${error.message}`);
    }
    // Restore owner role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "super_admin" } as never, {
        onConflict: "user_id,role",
      });
    return { ok: true };
  });

/** Insert a minimal but realistic demo dataset. Owner-only. */
export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireDevOwnerToolsEnabled();
    const { supabaseAdmin } = await assertOwner(context.userId);
    const uid = context.userId;

    // Projects
    const projects = [
      {
        name: "Atlas Launch",
        slug: `atlas-${Date.now()}`,
        description: "Q3 product rollout across regions.",
        status: "active" as const,
        priority: "high" as const,
        color: "#06b6d4",
        progress: 62,
        health: "on_track",
        owner_id: uid,
        created_by: uid,
      },
      {
        name: "Northstar Research",
        slug: `northstar-${Date.now()}`,
        description: "Customer discovery and segmentation.",
        status: "active" as const,
        priority: "medium" as const,
        color: "#8b5cf6",
        progress: 30,
        health: "at_risk",
        owner_id: uid,
        created_by: uid,
      },
      {
        name: "Internal Ops",
        slug: `ops-${Date.now()}`,
        description: "Process and tooling improvements.",
        status: "planning" as const,
        priority: "low" as const,
        color: "#10b981",
        progress: 12,
        health: "on_track",
        owner_id: uid,
        created_by: uid,
      },
    ];
    const { data: insertedProjects, error: pErr } = await supabaseAdmin
      .from("projects")
      .insert(projects as never)
      .select("id,name");
    if (pErr) throw new Error(`projects: ${pErr.message}`);

    // Tasks
    const tasks = (insertedProjects ?? []).flatMap((p, idx) =>
      [
        { title: `Kickoff — ${p.name}`, status: "done", priority: "medium" },
        { title: `Define scope — ${p.name}`, status: "in_progress", priority: "high" },
        { title: `Weekly review — ${p.name}`, status: "todo", priority: "medium" },
        { title: `Risks register — ${p.name}`, status: "todo", priority: "low" },
      ].map((t, i) => ({
        project_id: p.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee_id: uid,
        created_by: uid,
        position: idx * 10 + i,
      })),
    );
    if (tasks.length) {
      const { error } = await supabaseAdmin.from("tasks").insert(tasks as never);
      if (error) throw new Error(`tasks: ${error.message}`);
    }

    // Company channel + a few messages
    const { data: chan, error: cErr } = await supabaseAdmin
      .from("channels")
      .insert({
        name: "general",
        slug: `general-${Date.now()}`,
        type: "company",
        description: "Company-wide channel",
        created_by: uid,
      } as never)
      .select("id")
      .single();
    if (cErr) throw new Error(`channels: ${cErr.message}`);

    const messages = [
      { body: "Welcome to 1inow — this is a demo channel.", message_type: "normal" },
      { body: "Atlas Launch kickoff went well. Scope draft attached.", message_type: "normal" },
      { body: "Decision: ship beta to 10 design partners next Monday.", message_type: "decision" },
      { body: "Blocker: legal review pending on data export clause.", message_type: "blocker" },
    ];
    const { error: mErr } = await supabaseAdmin.from("messages").insert(
      messages.map((m) => ({
        channel_id: chan!.id,
        author_id: uid,
        body: m.body,
        message_type: m.message_type,
      })) as never,
    );
    if (mErr) throw new Error(`messages: ${mErr.message}`);

    return {
      ok: true,
      projects: insertedProjects?.length ?? 0,
      tasks: tasks.length,
      channels: 1,
      messages: messages.length,
    };
  });
