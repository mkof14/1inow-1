import { supabase } from "@/integrations/supabase/client";

export async function transcribeWithServerStt(input: {
  blob: Blob;
  mimeType?: string;
  language?: string;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const fd = new FormData();
  const ext = input.mimeType?.includes("mp4") ? "mp4" : "webm";
  fd.append("file", input.blob, `voice.${ext}`);
  if (input.language && /^[a-z]{2}$/i.test(input.language)) {
    fd.append("language", input.language.slice(0, 2).toLowerCase());
  }

  const res = await fetch("/api/stt", { method: "POST", headers, body: fd });
  if (!res.ok) return null;
  const payload = (await res.json()) as { text?: string };
  return payload.text?.trim() || null;
}

export function speechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function mediaRecorderSupported() {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined";
}
