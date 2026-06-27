import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { fetchChatThinkingData, summarizeWorkspaceContext } from "@/lib/chat-context.server";
import { logAiAction } from "@/lib/ai-audit.server";
import { getChatProviderState } from "@/lib/connection-providers.server";
import { buildSenseSystemPrompt } from "@/lib/sense-prompt.server";
import { extractMemoryTeach, saveMemoryTeach } from "@/lib/memory-engine";
import { buildSenseResponse, formatSenseResponse } from "@/lib/sense-engine";
import { captureServerException } from "@/lib/monitoring.server";
import { think, type ThinkingInput } from "@/lib/thinking";
import type { Database } from "@/integrations/supabase/types";

export type ChatGatewayInput = {
  prompt: string;
  lang: string;
  pageContext?: unknown;
  authorizationHeader?: string | null;
};

export type ChatGatewayResult = {
  text: string;
  provider: string;
  mode: "local_sense" | "openai";
};

async function resolveChatUserId(authorizationHeader?: string | null) {
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) return null;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function hasAssistantPermission(userId: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: userId,
    _permission_key: "use_assistant",
  });
  if (error) return false;
  return Boolean(data);
}

async function buildThinkingBundle(input: ChatGatewayInput, userId: string | null) {
  if (!userId) return null;

  const data = await fetchChatThinkingData({
    userId,
    authorizationHeader: input.authorizationHeader ?? null,
    pageContext: input.pageContext,
  });

  const thinkingInput: ThinkingInput = {
    prompt: input.prompt,
    pageContext: (input.pageContext ?? {}) as ThinkingInput["pageContext"],
    data,
  };

  return {
    data,
    thinking: think(thinkingInput),
    workspaceSummary: summarizeWorkspaceContext(data),
  };
}

async function callOpenAIChat(
  prompt: string,
  lang: string,
  options: {
    pageContext?: unknown;
    thinking?: ReturnType<typeof think>;
    workspaceSummary?: string;
  },
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const system = buildSenseSystemPrompt(lang, options.thinking);
  const contextBlock = [
    options.workspaceSummary,
    options.pageContext
      ? `Page context: ${JSON.stringify(options.pageContext).slice(0, 1200)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        ...(contextBlock ? [{ role: "system" as const, content: contextBlock }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI error (${response.status}): ${detail || response.statusText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty response");
  return text;
}

async function logAiChatAction(input: {
  userId: string;
  prompt: string;
  result: string;
  provider: string;
  lang: string;
  pageContext?: unknown;
  thinking?: ReturnType<typeof think>;
}) {
  await logAiAction({
    userId: input.userId,
    kind: "chat",
    prompt: input.prompt,
    result: {
      text: input.result.slice(0, 8000),
      provider: input.provider,
      lang: input.lang,
      intent: input.thinking?.understanding.intent,
      confidence: input.thinking?.confidence.level,
    },
    status: "completed",
    payload: { pageContext: input.pageContext ?? null },
    sources: input.thinking?.log.sources ?? [],
  });
}

function runLocalSense(
  input: ChatGatewayInput,
  bundle: Awaited<ReturnType<typeof buildThinkingBundle>>,
): ChatGatewayResult {
  const sense = buildSenseResponse(input.prompt, input.pageContext, input.lang);
  let text = formatSenseResponse(sense, input.lang);

  if (bundle?.thinking?.memory.length) {
    const memoryNote = bundle.thinking.memory
      .slice(0, 3)
      .map((m) => `${m.key}: ${m.value}`)
      .join("; ");
    text += `\n\n${input.lang.startsWith("ru") ? "Память" : "Memory"}: ${memoryNote}`;
  }

  return {
    text,
    provider: "local_sense",
    mode: "local_sense",
  };
}

export async function runChatGateway(input: ChatGatewayInput): Promise<ChatGatewayResult> {
  const chatState = getChatProviderState();
  const provider = chatState.provider;
  const userId = await resolveChatUserId(input.authorizationHeader);

  if (userId) {
    const teach = extractMemoryTeach(input.prompt);
    if (teach) {
      try {
        const text = await saveMemoryTeach({
          userId,
          key: teach.key,
          value: teach.value,
          type: teach.type,
          lang: input.lang,
        });
        await logAiChatAction({
          userId,
          prompt: input.prompt,
          result: text,
          provider: "memory",
          lang: input.lang,
          pageContext: input.pageContext,
        });
        return { text, provider: "memory", mode: "local_sense" };
      } catch (error) {
        await captureServerException(error, { module: "memory-engine", kind: "teach" });
      }
    }
  }

  const bundle = userId ? await buildThinkingBundle(input, userId).catch(() => null) : null;

  if (provider === "openai" && chatState.connected) {
    if (!userId) return runLocalSense(input, bundle);
    const allowed = await hasAssistantPermission(userId);
    if (!allowed) return runLocalSense(input, bundle);

    try {
      const text = await callOpenAIChat(input.prompt, input.lang, {
        pageContext: input.pageContext,
        thinking: bundle?.thinking,
        workspaceSummary: bundle?.workspaceSummary,
      });
      await logAiChatAction({
        userId,
        prompt: input.prompt,
        result: text,
        provider: "openai",
        lang: input.lang,
        pageContext: input.pageContext,
        thinking: bundle?.thinking,
      });
      return { text, provider: "openai", mode: "openai" };
    } catch (error) {
      await captureServerException(error, { module: "ai-gateway", provider: "openai" });
      return runLocalSense(input, bundle);
    }
  }

  return runLocalSense(input, bundle);
}
