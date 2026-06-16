import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatBody = { messages?: UIMessage[] };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { messages } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        // Gather lightweight user context from Supabase (best-effort)
        let contextBlock = "";
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
          if (token && process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY) {
            const sb = createClient(
              process.env.SUPABASE_URL,
              process.env.SUPABASE_PUBLISHABLE_KEY,
              {
                global: { headers: { Authorization: `Bearer ${token}` } },
                auth: { persistSession: false, autoRefreshToken: false },
              },
            );
            const { data: u } = await sb.auth.getUser();
            const userId = u.user?.id;
            if (userId) {
              const [projects, tasks, notifs] = await Promise.all([
                sb.from("projects").select("name,status,priority,progress,slug").limit(20),
                sb.from("tasks").select("title,status,due_date,priority").eq("assignee_id", userId).neq("status", "done").limit(30),
                sb.from("notifications").select("title,body,created_at,read_at").eq("user_id", userId).is("read_at", null).limit(10),
              ]);
              const name = (u.user?.user_metadata as { full_name?: string } | null)?.full_name ?? u.user?.email;
              contextBlock = [
                `Current user: ${name}`,
                `Active projects (${projects.data?.length ?? 0}): ${(projects.data ?? []).map((p) => `${p.name} [${p.status}, ${p.priority}, ${p.progress}%]`).join("; ") || "none"}`,
                `Open tasks for user (${tasks.data?.length ?? 0}): ${(tasks.data ?? []).slice(0, 15).map((t) => `${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`).join("; ") || "none"}`,
                `Unread notifications (${notifs.data?.length ?? 0}): ${(notifs.data ?? []).slice(0, 5).map((n) => n.title).join("; ") || "none"}`,
              ].join("\n");
            }
          }
        } catch (e) {
          console.error("ai context fetch failed", e);
        }

        const system = `You are Compass, an AI companion embedded inside Digital Invest Compass — a premium decision and execution environment for projects, people, decisions, and knowledge.

Behave like an intelligent partner, not a form. Be concise, warm, and decisive. Use short sentences. Surface what matters next, what is blocked, who is waiting. Offer concrete next actions when relevant. Use markdown lightly (bold, lists) when it helps scanning.

If the user asks to create, move, delegate, or schedule something, describe the action you would take and ask for one-tap confirmation — do not pretend it is done.

Live context for this user:
${contextBlock || "(no context available)"}`;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});