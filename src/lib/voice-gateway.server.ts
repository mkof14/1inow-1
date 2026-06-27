import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { logAiAction } from "@/lib/ai-audit.server";
import { getSttProviderState, getTtsProviderState } from "@/lib/connection-providers.server";
import {
  FOUNDER_VOICE_USER_ID,
  isFounderVoiceBypassHeader,
} from "@/lib/founder-voice.server";
import { synthesizeElevenLabsSpeech } from "@/lib/elevenlabs-tts.server";
import { captureServerException } from "@/lib/monitoring.server";
import { resolveTtsVoices } from "@/lib/sense-personas";
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
  await logAiAction({
    userId: input.userId,
    kind: input.kind,
    prompt: input.kind === "tts" ? String(input.payload.text ?? "") : null,
    result: input.payload,
    status: "completed",
    payload: { provider: input.provider },
    sources: [],
  });
}

function ttsNotReady(service: ReturnType<typeof getTtsProviderState>) {
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

async function runOpenAiTts(input: {
  text: string;
  voice?: string | null;
  lang?: string | null;
  userId: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      status: 503,
      body: { message: "OPENAI_API_KEY is missing." },
    };
  }

  const voices = resolveTtsVoices(input.lang ?? "en");
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL?.trim() || "tts-1-hd",
      input: input.text,
      voice: input.voice?.trim() || voices.nova,
      speed: 0.97,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI TTS error (${response.status}): ${detail || response.statusText}`);
  }

  const audio = await response.arrayBuffer();
  await logVoiceAction({
    userId: input.userId,
    kind: "tts",
    provider: "openai",
    payload: {
      text: input.text.slice(0, 200),
      voice: input.voice ?? voices.nova,
      lang: input.lang ?? null,
      bytes: audio.byteLength,
    },
  });

  return {
    ok: true as const,
    audio,
    contentType: response.headers.get("content-type") || "audio/mpeg",
  };
}

async function runElevenLabsTts(input: {
  text: string;
  voice?: string | null;
  lang?: string | null;
  userId: string;
}) {
  const result = await synthesizeElevenLabsSpeech(input);
  await logVoiceAction({
    userId: input.userId,
    kind: "tts",
    provider: "elevenlabs",
    payload: {
      text: input.text.slice(0, 200),
      voice: result.voiceId,
      model: result.model,
      lang: input.lang ?? null,
      bytes: result.audio.byteLength,
    },
  });

  return {
    ok: true as const,
    audio: result.audio,
    contentType: result.contentType,
  };
}

export async function runTtsGateway(input: {
  text: string;
  voice?: string | null;
  lang?: string | null;
  authorizationHeader?: string | null;
  requestHeaders?: Headers | Record<string, string | null | undefined>;
}) {
  const service = getTtsProviderState();
  const wired =
    service.connected && (service.provider === "openai" || service.provider === "elevenlabs");
  if (!wired) {
    return ttsNotReady(service);
  }

  const founderBypass = input.requestHeaders
    ? isFounderVoiceBypassHeader(input.requestHeaders)
    : false;
  const userId = await resolveVoiceUserId(input.authorizationHeader);
  const effectiveUserId = userId ?? (founderBypass ? FOUNDER_VOICE_USER_ID : null);

  if (!effectiveUserId) {
    return {
      ok: false as const,
      status: 401,
      body: { message: "Sign in required for server text-to-speech." },
    };
  }
  if (!founderBypass && userId && !(await hasVoicePermission(userId))) {
    return {
      ok: false as const,
      status: 403,
      body: { message: "Missing permission: use_voice" },
    };
  }

  try {
    if (service.provider === "elevenlabs") {
      return await runElevenLabsTts({ ...input, userId: effectiveUserId });
    }
    return await runOpenAiTts({ ...input, userId: effectiveUserId });
  } catch (error) {
    await captureServerException(error, { module: "voice-gateway", kind: "tts" });
    return {
      ok: false as const,
      status: 502,
      body: { message: error instanceof Error ? error.message : "TTS failed" },
    };
  }
}
