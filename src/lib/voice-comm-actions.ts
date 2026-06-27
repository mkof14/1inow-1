import { fetchChannels } from "@/lib/comm";
import type { VoicePlan } from "@/lib/voice-actions";

export function isSendMessagePhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:send|post|write|reply|respond|answer|отправ(?:ь|ить)|напиш(?:и|ите)|ответ(?:ь|ить)|publicar|escrib|schreib|antwort)/.test(
      lower,
    ) &&
    (/(?:message|msg|сообщ|reply here|ответь здесь|nachricht|mensaje)/.test(lower) ||
      /[:\-]\s*\S/.test(raw))
  );
}

export function extractSendMessageBody(raw: string) {
  const trimmed = raw.trim();
  const patterns = [
    /^(?:send|post|write|отправ(?:ь|ить)|напиш(?:и|ите)|publicar|escrib(?:e|ir)|schreib(?:e|en)?)\s+(?:a\s+)?(?:message|msg|сообщение|nachricht|mensaje)\s*[:\-]?\s*(.+)$/i,
    /^(?:reply|respond|answer|ответ(?:ь|ить)|reply here|ответь здесь|antwort(?:e|en)?)\s*[:\-]?\s*(.+)$/i,
    /^(?:say|скажи)\s+(?:in channel|в канал(?:е)?)\s*[:\-]?\s*(.+)$/i,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

export function extractSendMessageTarget(raw: string) {
  const m = raw.trim().match(
    /^(?:send|post|write|отправ(?:ь|ить)|напиш(?:и|ите))\s+(?:to|in|в|на)\s+(?:channel\s+)?(.+?)\s*[:\-]\s*(.+)$/i,
  );
  if (!m?.[1] || !m?.[2]) return null;
  return { channelName: m[1].trim(), body: m[2].trim() };
}

export async function resolveChannelIdByName(name: string): Promise<string | null> {
  const needle = name.toLowerCase().replace(/^#/, "").trim();
  if (!needle) return null;
  const channels = await fetchChannels();
  const hit =
    channels.find((c) => c.name.toLowerCase() === needle) ??
    channels.find((c) => c.slug?.toLowerCase() === needle) ??
    channels.find((c) => c.name.toLowerCase().includes(needle));
  return hit?.id ?? null;
}

export async function enrichSendMessagePlan(plan: VoicePlan, rawText: string): Promise<VoicePlan> {
  if (plan.intent !== "send_message" || plan.entityId) return plan;
  const target = extractSendMessageTarget(rawText);
  if (!target) return plan;
  const channelId = await resolveChannelIdByName(target.channelName);
  if (!channelId) return { ...plan, executable: false, confidence: "low" };
  return {
    ...plan,
    entityId: channelId,
    title: target.channelName,
    description: target.body,
    executable: Boolean(target.body),
    confidence: "high",
  };
}
