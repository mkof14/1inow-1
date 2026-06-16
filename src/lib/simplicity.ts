/**
 * Simplicity Framework — single source of truth for how the product
 * presents itself to the user. Pure data: rules, copy templates, helpers.
 * Used by the first-screen, by forms (smart defaults) and by the
 * /simplicity reference page. No external calls, no AI, no state.
 */

export interface SimplicityRule {
  id: string;
  title: string;
  rule: string;
}

export const simplicityRules: SimplicityRule[] = [
  { id: "minute",   title: "One-minute rule",        rule: "A new user should understand the product within one minute — without videos, tutorials or documentation." },
  { id: "first",    title: "First screen is calm",   rule: "Open with a greeting, four things that deserve attention, and three buttons: Talk, Review, Create. Nothing else." },
  { id: "one-click",title: "One click or one sentence", rule: "Every common action takes a single click, or a single natural sentence to the assistant." },
  { id: "no-empty", title: "No empty pages",         rule: "Every page shows something useful immediately — recent items, a continue action, or a single create button." },
  { id: "plain",    title: "Plain language only",    rule: "Never expose technical names: graph, vector, agent, LLM, workflow engine, background job. The user sees only their work." },
  { id: "disclose", title: "Progressive disclosure", rule: "Simple view first. Advanced options appear only when explicitly requested." },
  { id: "defaults", title: "Smart defaults",         rule: "Forms come pre-filled with today, current project, current user, recent people, recent folder." },
  { id: "zero",     title: "Zero configuration",     rule: "The app works on first open. No setup wizard, no mandatory profile completion." },
  { id: "talk",     title: "Conversation first",     rule: "Natural requests replace navigation: ‘find latest contract’, ‘remind me next month’, ‘prepare today’s work’." },
  { id: "quiet",    title: "Do not interrupt",       rule: "No popups, no tutorials, no tips. The user discovers naturally." },
  { id: "memory",   title: "Memory without work",    rule: "Remember silently. Only ask permission for important permanent knowledge." },
  { id: "calm",     title: "Visual calm",            rule: "One primary action, one main message, one clear focus per screen. Whitespace, readable type, large targets." },
  { id: "learn",    title: "Learning over time",     rule: "After a day — adapt. After a week — anticipate. After a month — organize. Without manual configuration." },
  { id: "relevant", title: "Discovery on relevance", rule: "Surface a feature only when the user’s behaviour makes it useful. Hide what they never use." },
  { id: "trust",    title: "Explain why",            rule: "Every recommendation states why it exists, what data was used, and what is missing." },
  { id: "humane-errors", title: "Humane errors",     rule: "Never say ‘something went wrong’. Say what was missing and offer the next step." },
  { id: "one-life", title: "One life, not two apps", rule: "Personal and business live together. The assistant understands family, travel, projects, meetings — within privacy settings." },
  { id: "metrics",  title: "Measure outcomes",       rule: "Minutes saved, questions avoided, typing reduced, repeated work eliminated. Not clicks, not pageviews." },
  { id: "veto",     title: "Complexity veto",        rule: "If a feature makes the product more complicated than helpful, do not build it." },
];

/* ───────────── Copy templates used across pages ───────────── */

export function firstScreenGreeting(firstName: string, attentionCount: number) {
  return {
    headline: `Hello ${firstName}.`,
    subline: attentionCount === 0
      ? "Nothing needs your attention right now."
      : `Here ${attentionCount === 1 ? "is" : "are"} ${attentionCount} thing${attentionCount === 1 ? "" : "s"} that deserve your attention today.`,
  };
}

/** Human errors — never raw "something went wrong". */
export function humaneError(kind: "not_found" | "no_match" | "offline" | "permission" | "unknown", subject?: string) {
  switch (kind) {
    case "not_found":   return { message: `I could not find ${subject ?? "that"} yet.`, suggest: "Search everywhere?" };
    case "no_match":    return { message: `Nothing matches ${subject ?? "your request"} so far.`, suggest: "Try a broader phrase?" };
    case "offline":     return { message: "I cannot reach the network right now.", suggest: "Try again in a moment." };
    case "permission":  return { message: `You do not have access to ${subject ?? "this item"}.`, suggest: "Ask the owner for access?" };
    default:            return { message: "I am not sure what to do with this yet.", suggest: "Could you rephrase?" };
  }
}

/** Smart defaults a form can adopt without asking the user. */
export function smartDefaults(input: {
  userId?: string;
  currentProjectId?: string;
  recentPeopleIds?: string[];
  recentFolderId?: string;
}) {
  const today = new Date();
  return {
    date: today.toISOString().slice(0, 10),
    ownerId: input.userId,
    projectId: input.currentProjectId,
    peopleIds: (input.recentPeopleIds ?? []).slice(0, 3),
    folderId: input.recentFolderId,
  };
}

/** Words we never show to the user. */
export const forbiddenJargon = [
  "context graph", "memory engine", "vector search", "agent orchestration",
  "workflow engine", "LLM", "background job", "embeddings", "RAG pipeline",
];

/** True if any forbidden technical term leaked into user-facing copy. */
export function hasJargon(text: string): boolean {
  const lower = text.toLowerCase();
  return forbiddenJargon.some((w) => lower.includes(w.toLowerCase()));
}

/** Compact system-prompt block to fold into assistant requests. */
export function simplicitySystemPrompt() {
  return [
    "Simplicity contract:",
    "- Use plain language. Never expose internal terms (graph, vector, agent, LLM, workflow engine).",
    "- Prefer one short useful answer over a long one.",
    "- Offer one next step, not a menu of options.",
    "- On errors, name what is missing and propose the next move. Never say ‘something went wrong’.",
    "- Suggest memory silently; ask permission only for permanent knowledge.",
  ].join("\n");
}