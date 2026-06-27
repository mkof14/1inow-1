import { splitNovaVeraSpeech } from "@/lib/sense-personas";
import { isLikelyQuestion } from "@/lib/voice-locale";
import type { VoiceConsoleMode } from "@/components/voice/voice-unified-console";

export type VoicePersona = "nova" | "vera";

/** Which persona leads for the current surface (architecture: Nova=commands, Vera=dialogue). */
export function resolveLeadPersona(mode: VoiceConsoleMode, utterance?: string): VoicePersona {
  if (mode === "commands") return "nova";
  if (utterance && isLikelyQuestion(utterance)) return "vera";
  return mode === "chat" ? "vera" : "nova";
}

/** Infer who should speak first from structured Sense text. */
export function resolveSpeakOrder(text: string, mode: VoiceConsoleMode): VoicePersona[] {
  const split = splitNovaVeraSpeech(text);
  const order: VoicePersona[] = [];
  if (split.nova.trim()) order.push("nova");
  if (split.vera.trim()) order.push("vera");
  if (order.length) return order;
  return [resolveLeadPersona(mode, text)];
}
