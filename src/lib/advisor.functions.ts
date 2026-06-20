import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

type Input = { prompt: string; lang?: string };

const LANG: Record<string, string> = { en: "English", ru: "Russian", uk: "Ukrainian" };

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const i = d as Input;
    if (!i?.prompt) throw new Error("prompt required");
    if (i.prompt.length > 4000) throw new Error("prompt too long");
    return i;
  })
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const { supabase, userId } = context;

    // Gather portfolio snapshot for context
    const [{ data: projects }, { data: myTasks }, { data: recentActivity }] = await Promise.all([
      supabase.from("projects").select("name,status,priority,progress,health,deadline,budget").limit(50),
      supabase.from("tasks").select("title,status,priority,due_date,project_id").eq("assignee_id", userId).neq("status", "done").limit(50),
      supabase.from("activity_logs").select("action,entity_type,created_at").order("created_at", { ascending: false }).limit(30),
    ]);

    const snapshot = {
      portfolio: {
        total: projects?.length ?? 0,
        active: projects?.filter((p: any) => p.status === "active" || p.status === "in_progress").length ?? 0,
        at_risk: projects?.filter((p: any) => p.health === "at_risk" || p.health === "off_track").length ?? 0,
        projects: (projects ?? []).slice(0, 20),
      },
      my_open_tasks: myTasks ?? [],
      recent_activity_count: recentActivity?.length ?? 0,
    };

    const langName = LANG[data.lang ?? "en"] ?? "English";

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `You are the strategic advisor for an executive workspace called DIOS. Be concise, decisive, outcome-oriented — like a senior chief of staff. Always answer in ${langName}. Use short paragraphs and bullet points. Cite specific projects or tasks by name from the snapshot when relevant. Never invent data.`,
      prompt: `Portfolio snapshot (JSON):\n${JSON.stringify(snapshot, null, 2)}\n\nUser question: ${data.prompt}`,
    });

    return { text };
  });