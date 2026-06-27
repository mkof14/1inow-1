export type VoiceInboxKind =
  | "task"
  | "project"
  | "note"
  | "reminder"
  | "risk"
  | "search"
  | "navigation"
  | "unknown";

export type VoiceInboxStatus = "new" | "processed" | "dismissed";

export type VoiceInboxItem = {
  id: string;
  raw: string;
  title: string;
  kind: VoiceInboxKind;
  status: VoiceInboxStatus;
  confidence: "high" | "medium" | "low";
  summary: string;
  createdAt: string;
  processedAt?: string;
};

export const VOICE_INBOX_EVENT = "1inow:voice-inbox-updated";
