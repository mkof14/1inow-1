/**
 * Thinking Engine — deterministic pre-AI pipeline.
 *
 * Every user prompt passes through these 12 stages. The engine never
 * calls an AI model itself; it produces a structured `ThinkingResult`
 * that the caller (chat, action runner, agent) uses to decide whether
 * to execute, ask, or escalate.
 *
 * Pure functions only — no I/O, no side effects. The caller supplies
 * the already-fetched data slices.
 */

export type Intent =
  | "ask"
  | "summarize"
  | "create"
  | "update"
  | "delete"
  | "schedule"
  | "delegate"
  | "search"
  | "plan"
  | "unknown";

export type AgentRole =
  | "planner"
  | "reviewer"
  | "researcher"
  | "controller"
  | "writer"
  | "translator"
  | "organizer"
  | "coordinator";

export type Confidence = "high" | "medium" | "low";

export type ThinkingInput = {
  prompt: string;
  pageContext?: {
    route?: string;
    scope?: string;
    title?: string;
    ids?: Record<string, string | undefined>;
  };
  data: {
    projects?: Array<{
      id: string;
      name: string;
      status?: string;
      slug?: string;
      owner_id?: string | null;
    }>;
    tasks?: Array<{
      id: string;
      title: string;
      status?: string;
      due_date?: string | null;
      assignee_id?: string | null;
      project_id?: string | null;
    }>;
    people?: Array<{ id: string; full_name?: string | null; email?: string | null }>;
    decisions?: Array<{ id: string; title: string; status?: string }>;
    memories?: Array<{ key: string; value: string; type?: string; confidence?: number }>;
    rules?: Array<{ rule: string; scope?: string | null }>;
  };
};

export type ThinkingResult = {
  understanding: { intent: Intent; subject: string; verbs: string[]; mentions: string[] };
  context: { page: string; signals: string[] };
  memory: Array<{ key: string; value: string }>;
  related: Array<{ kind: string; label: string; id?: string }>;
  rules: string[];
  missing: string[];
  confidence: { level: Confidence; score: number; reasons: string[] };
  agents: AgentRole[];
  plan: string[];
  allowExecute: boolean;
  selfCheck: { conflicts: string[]; notes: string[] };
  log: { reason: string; sources: string[]; createdAt: string };
};

/* ───── 1. Understand ───── */
const ACTION_VERBS: Record<Intent, RegExp> = {
  create: /\b(create|add|new|draft|make|start)\b/i,
  update: /\b(update|edit|change|rename|move|reassign|fix)\b/i,
  delete: /\b(delete|remove|archive|cancel)\b/i,
  schedule: /\b(schedule|book|meet|invite|calendar)\b/i,
  delegate: /\b(delegate|assign|hand off|send to)\b/i,
  summarize: /\b(summari[sz]e|recap|tl;dr|overview|status)\b/i,
  search: /\b(find|search|where is|look up|show me)\b/i,
  plan: /\b(plan|prepare|organi[sz]e|roadmap|agenda)\b/i,
  ask: /\?$|^(what|why|how|when|who|which)\b/i,
  unknown: /.^/,
};

function understand(prompt: string) {
  const verbs: string[] = [];
  let intent: Intent = "unknown";
  for (const [k, re] of Object.entries(ACTION_VERBS) as [Intent, RegExp][]) {
    if (re.test(prompt)) {
      verbs.push(k);
      if (intent === "unknown") intent = k;
    }
  }
  if (intent === "unknown" && prompt.trim()) intent = "ask";
  const mentions = Array.from(prompt.matchAll(/@([\w.-]+)/g)).map((m) => m[1]);
  const subject = prompt.replace(/\s+/g, " ").trim().slice(0, 120);
  return { intent, subject, verbs, mentions };
}

/* ───── 2. Context ───── */
function collectContext(input: ThinkingInput) {
  const p = input.pageContext ?? {};
  const signals: string[] = [];
  if (p.scope) signals.push(`scope:${p.scope}`);
  if (p.title) signals.push(`title:${p.title}`);
  if (p.ids)
    for (const [k, v] of Object.entries(p.ids)) if (v) signals.push(`${k}:${v.slice(0, 8)}`);
  return { page: p.route ?? "(none)", signals };
}

/* ───── 3. Memory ───── */
function pickMemory(input: ThinkingInput) {
  const text = input.prompt.toLowerCase();
  const mems = input.data.memories ?? [];
  return mems
    .filter((m) => {
      if ((m.confidence ?? 1) < 0.5) return false;
      const hay = `${m.key} ${m.value}`.toLowerCase();
      return text.split(/\W+/).some((w) => w.length > 3 && hay.includes(w));
    })
    .slice(0, 8)
    .map((m) => ({ key: m.key, value: m.value }));
}

/* ───── 4. Related objects ───── */
function findRelated(input: ThinkingInput) {
  const text = input.prompt.toLowerCase();
  const related: ThinkingResult["related"] = [];
  const push = (kind: string, label: string, id?: string) => {
    if (related.length < 12) related.push({ kind, label, id });
  };
  for (const p of input.data.projects ?? []) {
    if (p.name && text.includes(p.name.toLowerCase())) push("project", p.name, p.id);
  }
  for (const t of input.data.tasks ?? []) {
    if (t.title && text.includes(t.title.toLowerCase().slice(0, 24))) push("task", t.title, t.id);
  }
  for (const person of input.data.people ?? []) {
    const n = person.full_name?.toLowerCase();
    if (n && text.includes(n)) push("person", person.full_name!, person.id);
  }
  for (const d of input.data.decisions ?? []) {
    if (d.title && text.includes(d.title.toLowerCase().slice(0, 24)))
      push("decision", d.title, d.id);
  }
  // Fall back to the current page entity
  const ids = input.pageContext?.ids ?? {};
  if (!related.length && ids.projectId) {
    const p = (input.data.projects ?? []).find((x) => x.id === ids.projectId);
    if (p) push("project", p.name, p.id);
  }
  return related;
}

/* ───── 5. Rules ───── */
function applicableRules(input: ThinkingInput) {
  const scope = input.pageContext?.scope;
  return (input.data.rules ?? [])
    .filter((r) => !r.scope || r.scope === "global" || r.scope === scope)
    .map((r) => r.rule)
    .slice(0, 10);
}

/* ───── 6. Missing information ───── */
function findMissing(intent: Intent, input: ThinkingInput, related: ThinkingResult["related"]) {
  const missing: string[] = [];
  const need = (label: string) => missing.push(label);
  if (intent === "create" && !related.some((r) => r.kind === "project")) need("Target project");
  if (intent === "delegate" && !related.some((r) => r.kind === "person")) need("Assignee");
  if (
    intent === "schedule" &&
    !/\b\d{1,2}[:/]\d{2}|\btomorrow|\btoday|\bnext\b/i.test(input.prompt)
  )
    need("Date / time");
  if (intent === "update" && related.length === 0) need("Which item to update");
  if (intent === "delete" && related.length === 0) need("Which item to remove");
  return missing;
}

/* ───── 7. Confidence ───── */
function estimateConfidence(
  intent: Intent,
  related: ThinkingResult["related"],
  memory: ThinkingResult["memory"],
  missing: string[],
): ThinkingResult["confidence"] {
  let score = 60;
  const reasons: string[] = [];
  if (intent === "unknown") {
    score -= 25;
    reasons.push("intent unclear");
  } else reasons.push(`intent: ${intent}`);
  if (related.length) {
    score += Math.min(20, related.length * 5);
    reasons.push(`${related.length} related object(s)`);
  } else reasons.push("no related objects matched");
  if (memory.length) {
    score += Math.min(10, memory.length * 2);
    reasons.push(`${memory.length} memory hit(s)`);
  }
  if (missing.length) {
    score -= missing.length * 15;
    reasons.push(`${missing.length} missing input(s)`);
  }
  score = Math.max(0, Math.min(100, score));
  const level: Confidence = score >= 75 ? "high" : score >= 45 ? "medium" : "low";
  return { level, score, reasons };
}

/* ───── 8. Temporary agents ───── */
function pickAgents(intent: Intent): AgentRole[] {
  switch (intent) {
    case "plan":
      return ["planner", "researcher", "reviewer"];
    case "create":
      return ["writer", "reviewer"];
    case "update":
      return ["controller", "reviewer"];
    case "delete":
      return ["controller", "reviewer"];
    case "delegate":
      return ["coordinator", "controller"];
    case "schedule":
      return ["organizer", "coordinator"];
    case "summarize":
      return ["researcher", "writer"];
    case "search":
      return ["researcher"];
    case "ask":
      return ["researcher", "writer"];
    default:
      return ["researcher"];
  }
}

/* ───── 9. Plan ───── */
function buildPlan(
  intent: Intent,
  related: ThinkingResult["related"],
  missing: string[],
): string[] {
  if (missing.length) return [`Pause and ask: ${missing.join(", ")}`];
  const subjects = related.length
    ? related
        .slice(0, 3)
        .map((r) => `${r.kind}:${r.label}`)
        .join(", ")
    : "available context";
  switch (intent) {
    case "plan":
      return [
        "Collect related sources",
        "Draft outline",
        "List risks & open questions",
        "Present for review",
      ];
    case "summarize":
      return [
        `Gather ${subjects}`,
        "Group by theme",
        "Extract decisions & owners",
        "Write concise summary",
      ];
    case "create":
      return ["Validate inputs", "Draft item", "Show preview", "Wait for one-tap confirm"];
    case "update":
      return [`Locate ${subjects}`, "Compute diff", "Show preview", "Wait for confirm"];
    case "delete":
      return [`Locate ${subjects}`, "Show impact", "Ask for explicit confirm"];
    case "delegate":
      return ["Identify assignee", "Check workload", "Draft handoff note", "Wait for confirm"];
    case "schedule":
      return ["Resolve participants", "Find time slot", "Draft invite", "Wait for confirm"];
    case "search":
      return ["Scan indexes", "Rank matches", "Return top results"];
    case "ask":
      return ["Gather sources", "Compare facts", "Compose answer with citations"];
    default:
      return ["Clarify request"];
  }
}

/* ───── 10/11/12. Decision + self-check + log ───── */
function selfCheck(input: ThinkingInput, related: ThinkingResult["related"]) {
  const conflicts: string[] = [];
  const notes: string[] = [];
  const dupes = new Map<string, number>();
  for (const r of related) {
    const k = `${r.kind}:${r.label.toLowerCase()}`;
    dupes.set(k, (dupes.get(k) ?? 0) + 1);
  }
  for (const [k, n] of dupes) if (n > 1) conflicts.push(`Duplicate match: ${k}`);
  if ((input.data.tasks ?? []).some((t) => !t.assignee_id && related.some((r) => r.id === t.id))) {
    notes.push("Related task has no owner");
  }
  return { conflicts, notes };
}

export function think(input: ThinkingInput): ThinkingResult {
  const understanding = understand(input.prompt);
  const context = collectContext(input);
  const memory = pickMemory(input);
  const related = findRelated(input);
  const rules = applicableRules(input);
  const missing = findMissing(understanding.intent, input, related);
  const confidence = estimateConfidence(understanding.intent, related, memory, missing);
  const agents = pickAgents(understanding.intent);
  const plan = buildPlan(understanding.intent, related, missing);
  const check = selfCheck(input, related);

  const destructive = understanding.intent === "delete" || understanding.intent === "update";
  const allowExecute =
    missing.length === 0 &&
    check.conflicts.length === 0 &&
    (confidence.level === "high" || (confidence.level === "medium" && !destructive));

  const sources: string[] = [];
  if (memory.length) sources.push(`${memory.length} memory`);
  if (related.length) sources.push(`${related.length} related`);
  if (rules.length) sources.push(`${rules.length} rules`);
  if (context.signals.length) sources.push("page context");

  return {
    understanding,
    context,
    memory,
    related,
    rules,
    missing,
    confidence,
    agents,
    plan,
    allowExecute,
    selfCheck: check,
    log: {
      reason: `intent=${understanding.intent}; confidence=${confidence.level}; ${missing.length ? "blocked by missing input" : allowExecute ? "ready to execute" : "needs review"}`,
      sources,
      createdAt: new Date().toISOString(),
    },
  };
}

/* ───── In-memory thinking log (session-scoped) ───── */
const LOG: Array<{ prompt: string; result: ThinkingResult }> = [];
export function recordThinking(prompt: string, result: ThinkingResult) {
  LOG.unshift({ prompt, result });
  if (LOG.length > 25) LOG.length = 25;
}
export function getThinkingLog() {
  return LOG.slice();
}
