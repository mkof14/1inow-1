import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { logAiAction } from "@/lib/ai-audit.server";
import { getChatProviderState } from "@/lib/connection-providers.server";
import { buildSenseResponse, formatSenseResponse } from "@/lib/sense-engine";
import { captureServerException } from "@/lib/monitoring.server";
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

async function callOpenAIChat(prompt: string, lang: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
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
        {
          role: "system",
          content:
            "You are Sense, the 1inow workspace assistant. Be concise, practical, and safety-first. Never claim to execute external actions.",
        },
        {
          role: "user",
          content: `Language: ${lang}\n\n${prompt}`,
        },
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
}) {
  await logAiAction({
    userId: input.userId,
    kind: "chat",
    prompt: input.prompt,
    result: { text: input.result.slice(0, 8000), provider: input.provider, lang: input.lang },
    status: "completed",
    payload: { pageContext: input.pageContext ?? null },
    sources: [],
  });
}

function runLocalSense(input: ChatGatewayInput): ChatGatewayResult {
  const sense = buildSenseResponse(input.prompt, input.pageContext, input.lang);
  return {
    text: formatSenseResponse(sense, input.lang),
    provider: "local_sense",
    mode: "local_sense",
  };
}

export async function runChatGateway(input: ChatGatewayInput): Promise<ChatGatewayResult> {
  const chatState = getChatProviderState();
  const provider = chatState.provider;
  const userId = await resolveChatUserId(input.authorizationHeader);

  if (provider === "openai" && chatState.connected) {
    if (!userId) return runLocalSense(input);
    const allowed = await hasAssistantPermission(userId);
    if (!allowed) return runLocalSense(input);

    try {
      const text = await callOpenAIChat(input.prompt, input.lang);
      await logAiChatAction({
        userId,
        prompt: input.prompt,
        result: text,
        provider: "openai",
        lang: input.lang,
        pageContext: input.pageContext,
      });
      return { text, provider: "openai", mode: "openai" };
    } catch (error) {
      await captureServerException(error, { module: "ai-gateway", provider: "openai" });
      return runLocalSense(input);
    }
  }

  return runLocalSense(input);
}
