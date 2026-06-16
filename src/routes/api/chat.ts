import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type PageContext = {
  route?: string;
  scope?: string;
  title?: string;
  ids?: Record<string, string | undefined>;
  notes?: string;
};
type ChatBody = { messages?: UIMessage[]; pageContext?: PageContext };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { messages, pageContext } = (await request.json()) as ChatBody;
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
              const [projects, tasks, notifs, memories, rules, prefs] = await Promise.all([
                sb.from("projects").select("name,status,priority,progress,slug").limit(20),
                sb.from("tasks").select("title,status,due_date,priority").eq("assignee_id", userId).neq("status", "done").limit(30),
                sb.from("notifications").select("title,body,created_at,read_at").eq("user_id", userId).is("read_at", null).limit(10),
                sb.from("ai_memories").select("type,key,value,confidence,zone").eq("status","active").limit(50),
                sb.from("ai_rules").select("rule,scope").eq("active", true).limit(30),
                sb.from("assistant_preferences").select("mode,strictness,proactive_level").eq("user_id", userId).maybeSingle(),
              ]);
              const name = (u.user?.user_metadata as { full_name?: string } | null)?.full_name ?? u.user?.email;
              contextBlock = [
                `Current user: ${name}`,
                `Assistant mode: ${prefs.data?.mode ?? "calm"} (strictness ${prefs.data?.strictness ?? 2}/4)`,
                `Active projects (${projects.data?.length ?? 0}): ${(projects.data ?? []).map((p) => `${p.name} [${p.status}, ${p.priority}, ${p.progress}%]`).join("; ") || "none"}`,
                `Open tasks for user (${tasks.data?.length ?? 0}): ${(tasks.data ?? []).slice(0, 15).map((t) => `${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`).join("; ") || "none"}`,
                `Unread notifications (${notifs.data?.length ?? 0}): ${(notifs.data ?? []).slice(0, 5).map((n) => n.title).join("; ") || "none"}`,
                `User rules (${rules.data?.length ?? 0}): ${(rules.data ?? []).map((r) => `• ${r.rule}`).join(" ") || "none"}`,
                `Verified memories (${memories.data?.length ?? 0}): ${(memories.data ?? []).slice(0, 25).map((m) => `[${m.type}/${m.confidence}] ${m.key}: ${m.value}`).join(" | ") || "none"}`,
              ].join("\n");
            }
          }
        } catch (e) {
          console.error("ai context fetch failed", e);
        }

        const pageBlock = pageContext && (pageContext.scope || pageContext.route)
          ? `\nCurrent page: ${pageContext.route ?? "?"}${pageContext.scope ? ` — ${pageContext.scope}` : ""}${pageContext.title ? ` "${pageContext.title}"` : ""}${pageContext.ids ? ` ids=${JSON.stringify(pageContext.ids)}` : ""}${pageContext.notes ? `\nPage notes: ${pageContext.notes}` : ""}`
          : "";

        const system = `You are Compass, the intelligence layer of Digital Invest Compass — a private decision and execution environment.

TRUTH-FIRST RULES (non-negotiable):
1. Never invent facts, people, documents, numbers, deadlines, or summaries.
2. If information is missing, uncertain, outdated, or unclear, say so explicitly. Use phrases like:
   • "I do not know yet."
   • "I need more information."
   • "This is an assumption."
   • "This is based only on available data."
   • "Would you like to confirm this?"
3. Always separate FACT from ASSUMPTION. Cite the source (task, document, memory, message) when possible. If no source exists, say "No source found."
4. Never pretend an action is done. For create/move/delegate/schedule/send, describe the action and ask for one-tap confirmation.

CONFIDENCE: End substantive answers with a single line: \`Confidence: High|Medium|Low — <short reason>\`. If Low and the user requested an important action, ask a clarifying question first instead of acting.

CORRECTIONS: When the user corrects you, acknowledge it, restate the new fact precisely, and offer to save it as a memory.

STYLE: Concise, warm, decisive. Short sentences. Light markdown (bold, lists) when it aids scanning. No filler praise. No corporate tone.

Live context for this user:
${contextBlock || "(no context available — say so before answering anything specific)"}${pageBlock}`;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});