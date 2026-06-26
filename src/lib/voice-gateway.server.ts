import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { getSttProviderState, getTtsProviderState } from "@/lib/connection-providers.server";
import { captureServerException } from "@/lib/monitoring.server";
import type { Database } from "@/integrations/supabase/types";

async function resolveVoiceUserId(authorizationHeader?: string | null) {
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

async function hasVoicePermission(userId: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: userId,
    _permission_key: "use_voice",
  });
  if (error) return false;
  return Boolean(data);
}

async function logVoiceAction(input: {
  userId: string;
  kind: "stt" | "tts";
  provider: string;
  payload: Record<string, unknown>;
}) {
  if (process.env.AI_AUDIT_LOGGING_ENABLED === "false") return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_actions").insert({
      user_id: input.userId,
      kind: input.kind,
      prompt: input.kind === "tts" ? String(input.payload.text ?? "").slice(0, 4000) : null,
      result: input.payload,
      status: "completed",
      payload: { provider: input.provider },
      sources: [],
    } as never);
  } catch (error) {
    console.error("[voice-gateway] audit log failed", error);
  }
}

export async function runSttGateway(input: {
  file: Blob;
  filename: string;
  language?: string | null;
  authorizationHeader?: string | null;
}) {
  const service = getSttProviderState();
  if (service.provider !== "openai" || !service.connected) {
    return {
      ok: false as const,
      status: 501,
      body: {
        message: service.message,
        disabled: service.disabled,
        provider: service.provider,
        status: service.status,
      },
    };
  }

  const userId = await resolveVoiceUserId(input.authorizationHeader);
  if (!userId) {
    return {
      ok: false as const,
      status: 401,
      body: { message: "Sign in required for server speech-to-text." },
    };
  }
  if (!(await hasVoicePermission(userId))) {
    return {
      ok: false as const,
      status: 403,
      body: { message: "Missing permission: use_voice" },
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      status: 503,
      body: { message: "OPENAI_API_KEY is missing." },
    };
  }

  try {
    const form = new FormData();
    form.append("file", input.file, input.filename);
    form.append("model", process.env.OPENAI_STT_MODEL?.trim() || "whisper-1");
    if (input.language) form.append("language", input.language);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI STT error (${response.status}): ${detail || response.statusText}`);
    }

    const payload = (await response.json()) as { text?: string };
    const text = payload.text?.trim() ?? "";
    await logVoiceAction({
      userId,
      kind: "stt",
      provider: "openai",
      payload: { text: text.slice(0, 500), language: input.language ?? null },
    });

    return { ok: true as const, text };
  } catch (error) {
    await captureServerException(error, { module: "voice-gateway", kind: "stt" });
    return {
      ok: false as const,
      status: 502,
      body: { message: error instanceof Error ? error.message : "STT failed" },
    };
  }
}

export async function runTtsGateway(input: {
  text: string;
  voice?: string | null;
  lang?: string | null;
  authorizationHeader?: string | null;
}) {
  const service = getTtsProviderState();
  if (service.provider !== "openai" || !service.connected) {
    return {
      ok: false as const,
      status: 501,
      body: {
        message: service.message,
        disabled: service.disabled,
        provider: service.provider,
        status: service.status,
      },
    };
  }

  const userId = await resolveVoiceUserId(input.authorizationHeader);
  if (!userId) {
    return {
      ok: false as const,
      status: 401,
      body: { message: "Sign in required for server text-to-speech." },
    };
  }
  if (!(await hasVoicePermission(userId))) {
    return {
      ok: false as const,
      status: 403,
      body: { message: "Missing permission: use_voice" },
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      status: 503,
      body: { message: "OPENAI_API_KEY is missing." },
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL?.trim() || "tts-1",
        input: input.text,
        voice: input.voice?.trim() || "alloy",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI TTS error (${response.status}): ${detail || response.statusText}`);
    }

    const audio = await response.arrayBuffer();
    await logVoiceAction({
      userId,
      kind: "tts",
      provider: "openai",
      payload: {
        text: input.text.slice(0, 200),
        voice: input.voice ?? "alloy",
        lang: input.lang ?? null,
        bytes: audio.byteLength,
      },
    });

    return {
      ok: true as const,
      audio,
      contentType: response.headers.get("content-type") || "audio/mpeg",
    };
  } catch (error) {
    await captureServerException(error, { module: "voice-gateway", kind: "tts" });
    return {
      ok: false as const,
      status: 502,
      body: { message: error instanceof Error ? error.message : "TTS failed" },
    };
  }
}
