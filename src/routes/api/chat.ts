import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { principlesSystemPrompt } from "@/lib/principles";
import { simplicitySystemPrompt } from "@/lib/simplicity";

type PageContext = {
  route?: string;
  scope?: string;
  title?: string;
  ids?: Record<string, string | undefined>;
  notes?: string;
};
type ChatBody = { messages?: UIMessage[]; pageContext?: PageContext; lang?: string };

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  es: "Spanish",
  de: "German",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { messages, pageContext, lang: bodyLang } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        const lang = (bodyLang || request.headers.get("x-user-language") || "en").slice(0, 5).toLowerCase();
        const langName = LANG_NAMES[lang] ?? LANG_NAMES[lang.slice(0, 2)] ?? "English";

        // Gather lightweight user context from Supabase (best-effort)
        let contextBlock = "";
        let userId: string | null = null;
        let authedClient: ReturnType<typeof createClient> | null = null;
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
            authedClient = sb;
            const { data: u } = await sb.auth.getUser();
            userId = u.user?.id ?? null;
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

        const system = `You are 1inow, the intelligence layer of 1inow — a private decision and execution environment.

LANGUAGE (critical): Auto-detect the language of the user's latest message and reply in THAT language with a natural, human, conversational tone. The UI locale is "${lang}" (${langName}) — use it as a fallback when the message is too short to detect. Match the user's register (formal/informal), localize numbers, dates, and idioms, and never mix languages in one reply unless the user did.

SELF-LEARNING: When the user reveals a stable preference, fact, decision, correction, writing/communication style, deadline, priority, risk, or workflow rule that should persist across sessions, call the \`save_memory\` tool to store it. Be selective — never save trivia, transient context, or anything the user did not assert. Acknowledge the save briefly in the reply.

${principlesSystemPrompt()}

${simplicitySystemPrompt()}

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

        const MEMORY_TYPES = [
          "user_preference","project_fact","people_fact","company_fact","decision",
          "pattern","correction","workflow","writing_style","communication_style",
          "priority","deadline","risk","personal",
        ] as const;

        const tools = userId && authedClient
          ? {
              save_memory: tool({
                description:
                  "Persist a durable learning about the user (preference, fact, decision, correction, style, priority, deadline, risk, workflow) so 1inow improves over time. Only call when the user explicitly asserts something stable.",
                inputSchema: z.object({
                  type: z.enum(MEMORY_TYPES),
                  key: z.string().min(1).max(120),
                  value: z.string().min(1).max(800),
                  confidence: z.enum(["high", "medium", "low"]).default("medium"),
                  zone: z.enum(["business","personal","family","health","finance","legal"]).default("business"),
                  source_text: z.string().max(800).optional(),
                }),
                execute: async (input) => {
                  try {
                    const { error } = await authedClient!
                      .from("ai_memories")
                      .insert({
                        user_id: userId!,
                        type: input.type,
                        key: input.key,
                        value: input.value,
                        confidence: input.confidence,
                        zone: input.zone,
                        source_text: input.source_text ?? null,
                        status: "active",
                      });
                    if (error) return { saved: false, error: error.message };
                    return { saved: true };
                  } catch (e) {
                    return { saved: false, error: e instanceof Error ? e.message : "unknown" };
                  }
                },
              }),
            }
          : undefined;

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});