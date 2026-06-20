import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

type Input = { projectId: string; prompt: string; lang?: string };

const LANG: Record<string, string> = { en: "English", ru: "Russian", uk: "Ukrainian" };

export const askProjectAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const i = d as Input;
    if (!i?.projectId) throw new Error("projectId required");
    if (!i?.prompt) throw new Error("prompt required");
    if (i.prompt.length > 4000) throw new Error("prompt too long");
    return i;
  })
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const { supabase } = context;

    const [{ data: project }, { data: tasks }, { data: members }, { data: activity }] = await Promise.all([
      supabase.from("projects").select("name,description,status,priority,progress,health,deadline,start_date,budget").eq("id", data.projectId).maybeSingle(),
      supabase.from("tasks").select("title,status,priority,due_date,assignee_id,actual_hours,estimated_hours,completed_at").eq("project_id", data.projectId).limit(200),
      supabase.from("project_members").select("user_id,role").eq("project_id", data.projectId),
      supabase.from("activity_logs").select("action,entity_type,created_at,metadata").contains("metadata", { project_id: data.projectId } as any).order("created_at", { ascending: false }).limit(20),
    ]);

    if (!project) throw new Error("project not found");

    const now = Date.now();
    const T = tasks ?? [];
    const open = T.filter((t: any) => t.status !== "done" && t.status !== "canceled");
    const overdue = open.filter((t: any) => t.due_date && new Date(t.due_date).getTime() < now);
    const dueSoon = open.filter((t: any) => t.due_date && new Date(t.due_date).getTime() - now < 7 * 86400000 && new Date(t.due_date).getTime() >= now);
    const blocked = T.filter((t: any) => t.status === "blocked");
    const hours = T.reduce((a: number, t: any) => a + Number(t.actual_hours ?? 0), 0);
    const estimated = T.reduce((a: number, t: any) => a + Number(t.estimated_hours ?? 0), 0);

    const snapshot = {
      project,
      stats: {
        tasks_total: T.length,
        tasks_open: open.length,
        tasks_overdue: overdue.length,
        tasks_due_next_7d: dueSoon.length,
        tasks_blocked: blocked.length,
        hours_logged: Number(hours.toFixed(1)),
        hours_estimated: Number(estimated.toFixed(1)),
        team_size: (members ?? []).length,
      },
      overdue: overdue.slice(0, 10).map((t: any) => ({ title: t.title, due: t.due_date, priority: t.priority })),
      due_soon: dueSoon.slice(0, 10).map((t: any) => ({ title: t.title, due: t.due_date, priority: t.priority })),
      blocked: blocked.slice(0, 10).map((t: any) => ({ title: t.title, priority: t.priority })),
      recent_activity: (activity ?? []).slice(0, 10).map((a: any) => ({ action: a.action, type: a.entity_type, at: a.created_at })),
    };

    const langName = LANG[data.lang ?? "en"] ?? "English";
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `You are the AI Project Advisor for project "${project.name}". Be concise, decisive, and outcome-oriented — like a senior PM. Always answer in ${langName}. Use short paragraphs and bullet points. Cite specific tasks by name from the snapshot. Never invent data. When asked about risks, infer from overdue/blocked/at-risk/off-track signals.`,
      prompt: `Project snapshot (JSON):\n${JSON.stringify(snapshot, null, 2)}\n\nUser question: ${data.prompt}`,
    });

    return { text };
  });