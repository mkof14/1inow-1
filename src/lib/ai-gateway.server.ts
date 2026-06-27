import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { fetchChatThinkingData, summarizeWorkspaceContext } from "@/lib/chat-context.server";
import { logAiAction } from "@/lib/ai-audit.server";
import { getChatProviderState } from "@/lib/connection-providers.server";
import { buildSenseSystemPrompt, buildSenseVoiceCommandAppendix } from "@/lib/sense-prompt.server";
import { extractMemoryTeach, saveConversationMemory, saveMemoryTeach } from "@/lib/memory-engine";
import { resolveResponseLang, isLikelyQuestion } from "@/lib/voice-locale";
import { buildSenseResponse, formatSenseResponse } from "@/lib/sense-engine";
import {
  FOUNDER_VOICE_USER_ID,
  isFounderVoiceBypassHeader,
} from "@/lib/founder-voice.server";
import { captureServerException } from "@/lib/monitoring.server";
import { think, type ThinkingInput } from "@/lib/thinking";
import type { Database } from "@/integrations/supabase/types";

export type ChatGatewayInput = {
  prompt: string;
  lang: string;
  pageContext?: unknown;
  authorizationHeader?: string | null;
  requestHeaders?: Headers | Record<string, string | null | undefined>;
  /** Voice command center — request ACTION_JSON appendix */
  voiceCommand?: boolean;
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
    voiceCommand?: boolean;
  },
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  let system = buildSenseSystemPrompt(lang, options.thinking);
  if (options.voiceCommand) system += buildSenseVoiceCommandAppendix();
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
  const founderBypass = input.requestHeaders
    ? isFounderVoiceBypassHeader(input.requestHeaders)
    : false;
  const userId =
    (await resolveChatUserId(input.authorizationHeader)) ??
    (founderBypass ? FOUNDER_VOICE_USER_ID : null);
  const lang = resolveResponseLang(input.lang, input.prompt);
  const gatewayInput = { ...input, lang };

  if (userId) {
    const teach = extractMemoryTeach(gatewayInput.prompt);
    if (teach) {
      try {
        const text = await saveMemoryTeach({
          userId,
          key: teach.key,
          value: teach.value,
          type: teach.type,
          lang: gatewayInput.lang,
        });
        await logAiChatAction({
          userId,
          prompt: gatewayInput.prompt,
          result: text,
          provider: "memory",
          lang: gatewayInput.lang,
          pageContext: gatewayInput.pageContext,
        });
        return { text, provider: "memory", mode: "local_sense" };
      } catch (error) {
        await captureServerException(error, { module: "memory-engine", kind: "teach" });
      }
    }
  }

  const bundle = userId ? await buildThinkingBundle(gatewayInput, userId).catch(() => null) : null;

  if (provider === "openai" && chatState.connected) {
    if (!userId) return runLocalSense(gatewayInput, bundle);
    if (!founderBypass) {
      const allowed = await hasAssistantPermission(userId);
      if (!allowed) return runLocalSense(gatewayInput, bundle);
    }

    try {
      const text = await callOpenAIChat(gatewayInput.prompt, gatewayInput.lang, {
        pageContext: gatewayInput.pageContext,
        thinking: bundle?.thinking,
        workspaceSummary: bundle?.workspaceSummary,
        voiceCommand: gatewayInput.voiceCommand,
      });
      await logAiChatAction({
        userId,
        prompt: gatewayInput.prompt,
        result: text,
        provider: "openai",
        lang: gatewayInput.lang,
        pageContext: gatewayInput.pageContext,
        thinking: bundle?.thinking,
      });
      saveConversationMemory({
        userId,
        question: gatewayInput.prompt,
        answer: text,
        lang: gatewayInput.lang,
      }).catch(() => undefined);
      return { text, provider: "openai", mode: "openai" };
    } catch (error) {
      await captureServerException(error, { module: "ai-gateway", provider: "openai" });
      return runLocalSense(gatewayInput, bundle);
    }
  }

  const local = runLocalSense(gatewayInput, bundle);
  if (userId) {
    saveConversationMemory({
      userId,
      question: gatewayInput.prompt,
      answer: local.text,
      lang: gatewayInput.lang,
    }).catch(() => undefined);
  }
  return local;
}
