import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  Inbox,
  Loader2,
  Mic,
  MicOff,
  Navigation,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { saveVoiceInboxItem, type VoiceInboxKind } from "@/lib/voice-intake";

type VoiceIntent =
  | "open_route"
  | "create_task"
  | "create_project"
  | "show_today"
  | "show_risks"
  | "search"
  | "draft_note"
  | "draft_reminder"
  | "unknown";

type VoicePlan = {
  intent: VoiceIntent;
  label: string;
  summary: string;
  route?: string;
  title?: string;
  description?: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  question?: string;
  quickReplies?: string[];
  advice?: string[];
  executable: boolean;
};

const ROUTES = [
  {
    route: "/dashboard",
    label: "Dashboard",
    words: ["dashboard", "home", "today", "главная", "домой", "сегодня"],
  },
  { route: "/projects", label: "Projects", words: ["projects", "project", "проекты", "проект"] },
  { route: "/tasks", label: "Tasks", words: ["tasks", "task", "задачи", "задача", "дела"] },
  { route: "/calendar", label: "Calendar", words: ["calendar", "календарь", "расписание"] },
  {
    route: "/inbox",
    label: "Inbox",
    words: ["inbox", "notifications", "уведомления", "инбокс", "входящие"],
  },
  {
    route: "/communication",
    label: "Communication",
    words: ["messages", "communication", "chat", "сообщения", "коммуникации", "чат"],
  },
  { route: "/people", label: "People", words: ["people", "contacts", "люди", "контакты"] },
  { route: "/reports", label: "Reports", words: ["reports", "отчеты", "аналитика"] },
  {
    route: "/intelligence",
    label: "Intelligence",
    words: ["intelligence", "brain", "интеллект", "мозг"],
  },
  { route: "/ai", label: "Advisor", words: ["advisor", "assistant", "помощник", "ассистент"] },
  { route: "/administration", label: "Admin", words: ["admin", "админ", "администрирование"] },
  { route: "/settings", label: "Settings", words: ["settings", "настройки"] },
];

const EXAMPLES = [
  "Create task call contractor tomorrow",
  "Создай задачу купить материалы в субботу",
  "Create project home renovation",
  "Открой проекты",
  "Покажи риски",
  "Что сегодня важно",
  "Что мне делать дальше?",
  "Разбери мой день",
  "Запиши мысль про новый проект",
  "Напомни мне завтра проверить документы",
  "Open inbox",
  "Найди договор",
];

export function VoiceCommandCenter({
  open: controlledOpen,
  onOpenChange,
  showLauncher = true,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showLauncher?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<VoicePlan | null>(null);
  const [history, setHistory] = useState<VoicePlan[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("1inow:voice:history:v1") ?? "[]").slice(0, 6);
    } catch {
      return [];
    }
  });
  const recognitionRef = useRef<any>(null);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    try {
      localStorage.setItem("1inow:voice:history:v1", JSON.stringify(history.slice(0, 6)));
    } catch {}
  }, [history]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.message("Browser speech recognition is not available. Use text command input.");
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    let finalText = "";
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript + " ";
        else interim += result[0].transcript;
      }
      setText((finalText + interim).trim());
    };
    rec.onend = () => {
      setListening(false);
      const value = finalText.trim();
      if (value) setPlan(parseVoiceCommand(value));
    };
    rec.onerror = () => {
      setListening(false);
      toast.error("Voice capture stopped. Try again or type the command.");
    };
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  const quickCommands = useMemo(
    () => [
      { label: "Today", icon: CalendarDays, text: "What is important today?" },
      { label: "Risks", icon: AlertTriangle, text: "Show risks" },
      { label: "New task", icon: CheckSquare, text: "Create task " },
      { label: "New project", icon: FolderKanban, text: "Create project " },
    ],
    [],
  );

  const analyze = (value = text) => {
    const next = parseVoiceCommand(value);
    setPlan(next);
  };

  const answerClarification = (answer: string) => {
    const lowerAnswer = answer.toLowerCase();
    const current = text.trim();
    const nextText =
      lowerAnswer.includes("turn into task") || lowerAnswer.includes("review project")
        ? `Create task ${current}`
        : lowerAnswer.includes("create project") ||
            lowerAnswer.includes("new business project") ||
            lowerAnswer.includes("home project") ||
            lowerAnswer.includes("digitalinvest project") ||
            lowerAnswer.includes("personal project")
          ? `Create project ${current || answer}`
          : lowerAnswer.includes("save as note") || lowerAnswer.includes("keep as note")
            ? `Note ${current}`
            : lowerAnswer.includes("show today")
              ? "What is important today?"
              : [current, answer.trim()].filter(Boolean).join(" ");
    setText(nextText);
    setPlan(parseVoiceCommand(nextText));
  };

  const execute = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      if (
        plan.intent === "open_route" ||
        plan.intent === "show_today" ||
        plan.intent === "show_risks" ||
        plan.intent === "search"
      ) {
        navigate({ to: (plan.route ?? "/dashboard") as any });
        remember(plan);
        setOpen(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sign in required");

      if (plan.intent === "create_task") {
        const { error } = await supabase.from("tasks").insert({
          title: plan.title,
          description: plan.description || null,
          status: "todo",
          priority: "medium",
          created_by: data.user.id,
        });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success("Task created from voice command");
      } else if (plan.intent === "create_project") {
        const base = plan.title ?? "new-project";
        const slug = `${base
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
        const { error } = await supabase.from("projects").insert({
          name: plan.title,
          slug,
          description: plan.description || null,
          status: "planning",
          priority: "medium",
          created_by: data.user.id,
          owner_id: data.user.id,
        });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Project created from voice command");
      } else {
        toast.message("This voice action is drafted but not executable yet.");
      }
      remember(plan);
      setText("");
      setPlan(null);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voice command failed");
    } finally {
      setBusy(false);
    }
  };

  const remember = (done: VoicePlan) => {
    setHistory((items) =>
      [done, ...items.filter((item) => item.summary !== done.summary)].slice(0, 6),
    );
  };

  const captureToInbox = () => {
    if (!text.trim() || !plan) return;
    const item = saveVoiceInboxItem({
      raw: text,
      title: plan.title || text,
      kind: mapPlanToInboxKind(plan.intent),
      confidence: plan.confidence,
      summary: plan.summary,
    });
    if (!item) return;
    remember(plan);
    setText("");
    setPlan(null);
    toast.success("Saved to Voice Inbox");
  };

  return (
    <>
      {showLauncher && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-32 right-5 z-30 grid size-11 place-items-center rounded-full border border-accent/30 bg-card text-accent shadow-lg transition-all hover:-translate-y-0.5 hover:border-accent/50 md:bottom-20"
          aria-label="Open voice commands"
          title="Voice commands"
        >
          <Mic className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent live-dot" />
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) stopListening();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="size-5 text-accent" />
              1inow AI + Voice Command Center
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Say or type what you want 1inow to do</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Local assistant logic first: it can ask, clarify, suggest, draft, and execute
                    safe commands. External AI, STT, and TTS services remain disconnected.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={listening ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    listening && "bg-accent text-accent-foreground hover:bg-accent/90",
                  )}
                  onClick={listening ? stopListening : startListening}
                >
                  {listening ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                  {listening ? "Listening" : "Voice"}
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setPlan(null);
                }}
                placeholder="Example: create task call Alex tomorrow, open projects, show risks..."
                rows={3}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {quickCommands.map((command) => (
                  <button
                    key={command.label}
                    type="button"
                    onClick={() => {
                      setText(command.text);
                      setPlan(parseVoiceCommand(command.text));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/35 hover:text-foreground"
                  >
                    <command.icon className="size-3.5 text-accent" />
                    {command.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-[11px] text-muted-foreground">
                  Supports navigation, task/project creation, today brief, risk review, search,
                  notes/reminders drafts, and clarification questions.
                </div>
                <Button type="button" size="sm" onClick={() => analyze()} disabled={!text.trim()}>
                  Understand
                </Button>
              </div>
            </div>

            {plan && (
              <VoicePlanPreview
                plan={plan}
                busy={busy}
                onCancel={() => setPlan(null)}
                onCapture={captureToInbox}
                onConfirm={execute}
                onClarify={answerClarification}
              />
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-accent" />
                  Command examples
                </div>
                <div className="space-y-1.5">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setText(example);
                        setPlan(parseVoiceCommand(example));
                      }}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/5 hover:text-foreground"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4 text-accent" />
                  Recent voice actions
                </div>
                {history.length ? (
                  <div className="space-y-1.5">
                    {history.map((item) => (
                      <div
                        key={`${item.intent}-${item.summary}`}
                        className="rounded-lg border border-border/70 px-2 py-1.5"
                      >
                        <div className="truncate text-xs font-medium">{item.label}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {item.summary}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No voice actions yet.</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VoicePlanPreview({
  plan,
  busy,
  onCancel,
  onCapture,
  onConfirm,
  onClarify,
}: {
  plan: VoicePlan;
  busy: boolean;
  onCancel: () => void;
  onCapture: () => void;
  onConfirm: () => void;
  onClarify: (answer: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Assistant understood
          </div>
          <div className="mt-1 text-base font-semibold">{plan.label}</div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
        </div>
        <ConfidenceBadge value={plan.confidence} />
      </div>

      {plan.title && (
        <div className="mb-3 rounded-xl border border-border bg-card/70 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Draft</div>
          <div className="mt-1 text-sm font-medium">{plan.title}</div>
          {plan.description && (
            <div className="mt-1 text-xs text-muted-foreground">{plan.description}</div>
          )}
        </div>
      )}

      {plan.question && (
        <div className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            I need to clarify
          </div>
          <div className="mt-1 text-sm font-medium">{plan.question}</div>
          {plan.quickReplies?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => onClarify(reply)}
                  className="rounded-full border border-amber-500/25 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-amber-500/50 hover:bg-amber-500/10"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {plan.advice?.length ? (
        <div className="mb-3 rounded-xl border border-teal-500/20 bg-teal-500/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            Assistant advice
          </div>
          <ul className="mt-2 space-y-1">
            {plan.advice.map((item) => (
              <li key={item} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-teal-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-border bg-card/70 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
          <Search className="size-3.5 text-accent" />
          Evidence
        </div>
        <ul className="space-y-1">
          {plan.evidence.map((line) => (
            <li key={line} className="flex gap-2 text-xs text-muted-foreground">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          <X className="mr-1.5 size-4" />
          Cancel
        </Button>
        <Button type="button" variant="outline" onClick={onCapture} disabled={busy}>
          <Inbox className="mr-1.5 size-4" />
          Save to inbox
        </Button>
        <Button type="button" onClick={plan.executable ? onConfirm : onCapture} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-1.5 size-4" />
          )}
          {plan.executable ? "Confirm action" : plan.question ? "Save unresolved" : "Save draft"}
        </Button>
      </div>
    </div>
  );
}

function mapPlanToInboxKind(intent: VoiceIntent): VoiceInboxKind {
  if (intent === "create_task") return "task";
  if (intent === "create_project") return "project";
  if (intent === "draft_note") return "note";
  if (intent === "draft_reminder") return "reminder";
  if (intent === "show_risks") return "risk";
  if (intent === "search") return "search";
  if (intent === "open_route" || intent === "show_today") return "navigation";
  return "unknown";
}

function ConfidenceBadge({ value }: { value: VoicePlan["confidence"] }) {
  const className =
    value === "high"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
      : value === "medium"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${className}`}>
      {value}
    </span>
  );
}

function parseVoiceCommand(raw: string): VoicePlan {
  const text = raw.trim();
  const lower = normalize(text);

  if (!text) return unknownPlan(text, "No command text was provided.");

  const createTaskMatch = matchCreate(lower, [
    "create task",
    "new task",
    "add task",
    "создай задачу",
    "добавь задачу",
    "новая задача",
    "мне нужно",
    "надо",
    "нужно",
  ]);
  if (createTaskMatch) {
    const title = cleanupTitle(text.slice(createTaskMatch.length));
    return {
      intent: "create_task",
      label: "Create task",
      summary: title
        ? `Create a task named "${title}".`
        : "I can create a task, but I need the actual task title first.",
      title: title || undefined,
      description: inferDomainDescription(lower),
      confidence: title ? "high" : "low",
      evidence: [
        "Matched create task phrase",
        "Execution requires explicit confirmation",
        "Source: local voice intent parser",
      ],
      question: title ? undefined : "What exactly should the task be?",
      quickReplies: title
        ? undefined
        : ["Call someone", "Prepare documents", "Buy something", "Review project"],
      advice: [
        "If this has a deadline, include today, tomorrow, or a date in the command.",
        "If it belongs to a project, mention the project name.",
      ],
      executable: Boolean(title),
    };
  }

  const createProjectMatch = matchCreate(lower, [
    "create project",
    "new project",
    "add project",
    "создай проект",
    "добавь проект",
    "новый проект",
  ]);
  if (createProjectMatch) {
    const title = cleanupTitle(text.slice(createProjectMatch.length));
    return {
      intent: "create_project",
      label: "Create project",
      summary: title
        ? `Create a project named "${title}".`
        : "I can create a project, but I need a project name first.",
      title: title || undefined,
      description: inferDomainDescription(lower),
      confidence: title ? "high" : "low",
      evidence: [
        "Matched create project phrase",
        "Execution requires explicit confirmation",
        "Source: local voice intent parser",
      ],
      question: title ? undefined : "What should this project be called?",
      quickReplies: title
        ? undefined
        : ["New business project", "Home project", "DigitalInvest project", "Personal project"],
      advice: [
        "A useful project needs a clear outcome, owner, and next action.",
        "After creation, add the first task so the project does not stay empty.",
      ],
      executable: Boolean(title),
    };
  }

  if (
    includesAny(lower, [
      "what should i do",
      "what do i do",
      "next step",
      "what next",
      "help me",
      "помоги",
      "что мне делать",
      "что дальше",
      "следующий шаг",
      "разбери день",
      "разбери мой день",
      "план на день",
    ])
  ) {
    return routePlan(
      "show_today",
      "Review today's priorities",
      "Open Dashboard for a practical daily brief: focus, risks, waiting items, and next actions.",
      "/dashboard",
      "high",
      [
        "Matched help/today planning phrase",
        "Dashboard and System Brain already derive today focus from existing data",
      ],
      [
        "Start with the highest-risk or overdue item, not the easiest item.",
        "If the day is unclear, save raw thoughts to Voice Inbox first.",
        "Use System Brain when you want a deeper project and waiting review.",
      ],
    );
  }

  if (includesAny(lower, ["show risks", "risks", "риск", "риски", "покажи риски"])) {
    return routePlan(
      "show_risks",
      "Show risks",
      "Open Projects risk view context.",
      "/projects",
      "high",
      ["Matched risk phrase", "Best current risk surface is Projects + Daily Command Center"],
      [
        "Review risks before creating more work.",
        "A risk should be attached to a project and have an owner or next action.",
      ],
    );
  }

  if (
    includesAny(lower, [
      "what today",
      "today important",
      "what is important today",
      "что сегодня",
      "что важно",
      "сегодня важно",
    ])
  ) {
    return routePlan(
      "show_today",
      "Show today's command center",
      "Open Dashboard for today focus, risk, decisions, and suggested actions.",
      "/dashboard",
      "high",
      ["Matched today/focus phrase", "Dashboard contains Daily Command Center"],
      [
        "Use today view to choose one concrete next move.",
        "If something feels unclear, ask the assistant to save it as a voice inbox item.",
      ],
    );
  }

  if (includesAny(lower, ["search", "find", "найди", "поиск"])) {
    return routePlan(
      "search",
      "Open search",
      "Open Dashboard. Use global search from the top bar or slash shortcut.",
      "/dashboard",
      "medium",
      ["Matched search phrase", "Global command/search is available in app shell"],
      ["Search is currently routed to the app shell/global search surface."],
    );
  }

  if (includesAny(lower, ["note", "idea", "remember", "заметка", "идея", "запиши", "мысль"])) {
    const title = cleanupTitle(
      text.replace(/^(note|idea|remember|заметка|идея|запиши|мысль)/i, ""),
    );
    return {
      intent: "draft_note",
      label: "Draft note",
      summary: "Notes are drafted here. Dedicated note creation is not connected yet.",
      title: title || text,
      confidence: "medium",
      evidence: [
        "Matched note phrase",
        "Notes route exists, but write flow is not connected in voice center yet",
      ],
      question: "Should this stay as a note, become a task, or attach to a project?",
      quickReplies: ["Keep as note", "Turn into task", "Attach to project", "Ask me later"],
      advice: [
        "Good notes preserve context. Good tasks include a verb and a next action.",
        "If this affects an active project, mention the project name next time.",
      ],
      executable: false,
    };
  }

  if (includesAny(lower, ["remind", "reminder", "напомни", "напоминание"])) {
    const hasTimeSignal = includesAny(lower, [
      "today",
      "tomorrow",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "сегодня",
      "завтра",
      "понедельник",
      "вторник",
      "среду",
      "четверг",
      "пятницу",
      "субботу",
      "воскресенье",
    ]);
    return {
      intent: "draft_reminder",
      label: "Draft reminder",
      summary:
        "Reminder intent detected. Reminder execution needs a dedicated reminders data flow later.",
      title: text,
      confidence: hasTimeSignal ? "medium" : "low",
      evidence: ["Matched reminder phrase", "No production reminder execution is connected yet"],
      question: hasTimeSignal ? undefined : "When should I remind you?",
      quickReplies: hasTimeSignal ? undefined : ["Today", "Tomorrow", "This week", "Ask me later"],
      advice: [
        "Reminder execution is not connected yet, so I can safely save this as a draft.",
        "Use a specific time later when reminders are connected.",
      ],
      executable: false,
    };
  }

  const route = ROUTES.find((item) =>
    includesAny(lower, [
      "open " + item.label.toLowerCase(),
      "go " + item.label.toLowerCase(),
      ...item.words,
    ]),
  );
  if (route) {
    return routePlan(
      "open_route",
      `Open ${route.label}`,
      `Navigate to ${route.label}.`,
      route.route,
      "high",
      [`Matched route keywords: ${route.words.slice(0, 3).join(", ")}`, "Source: local route map"],
      [`Opening ${route.label} is a safe command and does not change data.`],
    );
  }

  return unknownPlan(text, "I can draft this, but I need a clearer command before executing.");
}

function routePlan(
  intent: VoiceIntent,
  label: string,
  summary: string,
  route: string,
  confidence: VoicePlan["confidence"],
  evidence: string[],
  advice?: string[],
): VoicePlan {
  return { intent, label, summary, route, confidence, evidence, advice, executable: true };
}

function unknownPlan(text: string, summary: string): VoicePlan {
  return {
    intent: "unknown",
    label: "Unknown command",
    summary,
    title: text || undefined,
    confidence: "low",
    evidence: [
      "No supported local intent matched",
      "Try create task, create project, open page, show today, or show risks",
    ],
    question: "What should I do with this?",
    quickReplies: ["Save as note", "Turn into task", "Create project", "Show today"],
    advice: [
      "When unsure, I will save the thought instead of inventing an action.",
      "For execution, say a clear verb: create, open, show, find, remind, or save.",
    ],
    executable: false,
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function matchCreate(value: string, phrases: string[]) {
  return phrases.find((phrase) => value.startsWith(phrase));
}

function cleanupTitle(value: string) {
  return value
    .replace(/^(to|about|про|о|на тему)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function inferDomainDescription(lower: string) {
  const domains = [
    ["home", "дом", "ремонт", "квартира"],
    ["family", "семья", "дети"],
    ["finance", "финансы", "деньги", "банк"],
    ["health", "здоровье", "врач"],
    ["travel", "поездка", "travel", "flight"],
    ["work", "работа", "клиент", "project"],
  ];
  const found = domains.find(([, ...words]) => words.some((word) => lower.includes(word)));
  return found ? `Voice domain: ${found[0]}` : "";
}
