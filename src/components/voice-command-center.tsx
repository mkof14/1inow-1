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
  Navigation,
  Search,
  ShieldCheck,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { buildSenseResponse } from "@/lib/sense-engine";
import { createProjectRecord, createTaskRecord } from "@/lib/project-task-engine";
import { SENSE_ASSETS, SENSE_NAME } from "@/lib/sense-assets";
import { saveVoiceInboxItem, type VoiceInboxKind } from "@/lib/voice-intake";
import { useI18n } from "@/lib/i18n";
import { VoiceControlBar } from "@/components/voice/voice-control-bar";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { resolveResponseLang } from "@/lib/voice-locale";
import { buildPerspectiveSpeech, toVoiceLocale, voiceBundle, VOICE_ROUTES } from "@/lib/voice-i18n";

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
  rawText?: string;
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

type VoicePerspective = {
  persona: "Nova" | "Vera";
  role: string;
  voice: string;
  image: string;
  text: string;
};

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
  const { t, lang, setLang } = useI18n();
  const [internalOpen, setInternalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<VoicePlan | null>(null);
  const onTranscriptRef = useRef<(value: string, final: boolean) => void>(() => {});
  const voice = useVoiceSession({
    lang,
    continuous: false,
    onTranscript: (value, final) => onTranscriptRef.current(value, final),
  });
  onTranscriptRef.current = (value, final) => {
    setText(value);
    if (final) {
      const responseLang = resolveResponseLang(lang, value);
      if (responseLang !== lang) setLang(responseLang);
      setPlan(parseVoiceCommand(value, responseLang));
    }
  };
  const voiceLabels = {
    micOn: t("voice.mic.on"),
    micOff: t("voice.mic.off"),
    speakerOn: t("voice.speaker.on"),
    speakerOff: t("voice.speaker.off"),
    listening: t("voice.status.listening"),
    transcribing: t("voice.status.transcribing"),
    speaking: t("voice.status.speaking"),
    idle: t("voice.status.idle"),
  };
  const [history, setHistory] = useState<VoicePlan[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("1inow:voice:history:v1") ?? "[]").slice(0, 6);
    } catch {
      return [];
    }
  });
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    try {
      localStorage.setItem("1inow:voice:history:v1", JSON.stringify(history.slice(0, 6)));
    } catch {}
  }, [history]);

  const quickCommands = useMemo(() => {
    const loc = toVoiceLocale(lang);
    const labels =
      loc === "ru"
        ? { today: "Сегодня", risks: "Риски", task: "Задача", project: "Проект" }
        : loc === "uk"
          ? { today: "Сьогодні", risks: "Ризики", task: "Задача", project: "Проєкт" }
          : loc === "es"
            ? { today: "Hoy", risks: "Riesgos", task: "Tarea", project: "Proyecto" }
            : loc === "de"
              ? { today: "Heute", risks: "Risiken", task: "Aufgabe", project: "Projekt" }
              : { today: "Today", risks: "Risks", task: "New task", project: "New project" };
    const texts =
      loc === "ru"
        ? {
            today: "Что сегодня важно?",
            risks: "Покажи риски",
            task: "Создай задачу ",
            project: "Создай проект ",
          }
        : loc === "uk"
          ? {
              today: "Що сьогодні важливо?",
              risks: "Покажи ризики",
              task: "Створи задачу ",
              project: "Створи проєкт ",
            }
          : loc === "es"
            ? {
                today: "¿Qué es importante hoy?",
                risks: "Mostrar riesgos",
                task: "Crear tarea ",
                project: "Crear proyecto ",
              }
            : loc === "de"
              ? {
                  today: "Was ist heute wichtig?",
                  risks: "Risiken zeigen",
                  task: "Aufgabe erstellen ",
                  project: "Projekt erstellen ",
                }
              : {
                  today: "What is important today?",
                  risks: "Show risks",
                  task: "Create task ",
                  project: "Create project ",
                };
    return [
      { label: labels.today, icon: CalendarDays, text: texts.today },
      { label: labels.risks, icon: AlertTriangle, text: texts.risks },
      { label: labels.task, icon: CheckSquare, text: texts.task },
      { label: labels.project, icon: FolderKanban, text: texts.project },
    ];
  }, [lang]);

  const analyze = (value = text) => {
    const next = parseVoiceCommand(value, lang);
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
    setPlan(parseVoiceCommand(nextText, lang));
  };

  const execute = async () => {
    if (!plan) return;
    const toasts = voiceBundle(lang, text).toasts;
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

      if (plan.intent === "create_task") {
        await createTaskRecord({
          title: plan.title?.trim() || "Untitled task",
          description: plan.description || null,
        });
        await queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success(toasts.taskCreated);
      } else if (plan.intent === "create_project") {
        await createProjectRecord({
          name: plan.title?.trim() || "Untitled project",
          description: plan.description || null,
        });
        await queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success(toasts.projectCreated);
      } else {
        toast.message(toasts.notExecutable);
      }
      remember(plan);
      setText("");
      setPlan(null);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : voiceBundle(lang, text).toasts.failed);
    } finally {
      setBusy(false);
    }
  };

  const remember = (done: VoicePlan) => {
    setHistory((items) =>
      [done, ...items.filter((item) => item.summary !== done.summary)].slice(0, 6),
    );
  };

  const captureToInbox = async () => {
    if (!text.trim() || !plan) return;
    const item = await saveVoiceInboxItem({
      raw: text,
      title: plan.title || text,
      kind: mapPlanToInboxKind(plan.intent),
      confidence: plan.confidence,
      summary: plan.summary,
    });
    if (!item) return;
    await queryClient.invalidateQueries({ queryKey: ["voice-inbox"] });
    remember(plan);
    setText("");
    setPlan(null);
    toast.success(voiceBundle(lang, text).toasts.savedInbox);
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
          if (!value) void voice.stopMic();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={SENSE_ASSETS.sense} alt="" className="size-7 rounded-xl" />
              {SENSE_NAME} Voice Center
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {t("voice.center.title", "Say or type what you want")}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("voice.center.hint")}</p>
                </div>
              </div>
              <VoiceControlBar
                phase={voice.phase}
                lang={lang}
                micStream={voice.micStream}
                speakerOn={voice.speakerOn}
                speakingAudio={voice.speakingAudio}
                error={voice.error}
                onToggleMic={voice.toggleMic}
                onToggleSpeaker={voice.toggleSpeaker}
                labels={voiceLabels}
                compact
                className="mb-3"
              />
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
                      setPlan(parseVoiceCommand(command.text, lang));
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
                lang={lang}
                onSpeak={(payload) => voice.speakText(payload)}
                onCancel={() => setPlan(null)}
                onCapture={captureToInbox}
                onConfirm={execute}
                onClarify={answerClarification}
              />
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Navigation className="size-4 text-accent" />
                  Command examples
                </div>
                <div className="space-y-1.5">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setText(example);
                        setPlan(parseVoiceCommand(example, lang));
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
  lang,
  onSpeak,
  onCancel,
  onCapture,
  onConfirm,
  onClarify,
}: {
  plan: VoicePlan;
  busy: boolean;
  lang: string;
  onSpeak: (text: string) => void;
  onCancel: () => void;
  onCapture: () => void;
  onConfirm: () => void;
  onClarify: (answer: string) => void;
}) {
  const perspectives = buildVoicePerspectives(plan, lang);
  const speechText = `Nova: ${perspectives[0]?.text ?? ""}\n\nVera: ${perspectives[1]?.text ?? ""}`;

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Sense understood
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
            Sense advice
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

      <div className="mb-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
              Sense review
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Nova pushes the next useful move. Vera checks meaning, risk, and priority before
              action.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => onSpeak(speechText)}
          >
            <Volume2 className="size-3.5" />
            Speak both
          </Button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {perspectives.map((item) => (
            <div
              key={item.persona}
              className="rounded-xl border border-violet-500/20 bg-background/75 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={item.image}
                    alt=""
                    className="size-8 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 text-xs font-semibold">{item.persona}</div>
                </div>
                <div className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                  {item.voice}
                </div>
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {item.role}
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

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

function buildVoicePerspectives(plan: VoicePlan, uiLang: string): VoicePerspective[] {
  const locale = toVoiceLocale(uiLang, plan.rawText || plan.title || plan.summary);
  const sense = buildSenseResponse(
    plan.rawText || plan.title || plan.summary,
    {
      module: "voice-center",
      intent: plan.intent,
      confidence: plan.confidence,
      executable: plan.executable,
      question: plan.question,
    },
    locale,
  );
  const { operator, auditor } = buildPerspectiveSpeech(locale, plan, sense);
  const roles =
    locale === "ru" || locale === "uk"
      ? { nova: "Действие и следующий шаг", vera: "Риск, смысл, приоритет" }
      : locale === "es"
        ? { nova: "Acción y siguiente paso", vera: "Riesgo y prioridad" }
        : locale === "de"
          ? { nova: "Aktion und nächster Schritt", vera: "Risiko und Priorität" }
          : { nova: "Action and next step", vera: "Risk, meaning, priority" };

  return [
    {
      persona: "Nova",
      role: roles.nova,
      voice: locale === "ru" || locale === "uk" ? "тёплый голос Nova" : "Nova voice",
      image: SENSE_ASSETS.nova,
      text: operator,
    },
    {
      persona: "Vera",
      role: roles.vera,
      voice: locale === "ru" || locale === "uk" ? "спокойный голос Vera" : "Vera voice",
      image: SENSE_ASSETS.vera,
      text: auditor,
    },
  ];
}

function parseVoiceCommand(raw: string, uiLang = "en"): VoicePlan {
  const text = raw.trim();
  const lower = normalize(text);
  const locale = toVoiceLocale(uiLang, text);
  const b = voiceBundle(uiLang, text);
  const en = voiceBundle("en");

  const taskPhrases = [...en.createTask, ...b.createTask];
  const projectPhrases = [...en.createProject, ...b.createProject];
  const todayPhrases = [...en.today, ...b.today];
  const riskPhrases = [...en.risks, ...b.risks];
  const searchPhrases = [...en.search, ...b.search];
  const notePhrases = [...en.note, ...b.note];
  const reminderPhrases = [...en.reminder, ...b.reminder];

  if (!text) return unknownPlan(text, b.unknownSummary, b);

  const createTaskMatch = matchCreate(lower, taskPhrases);
  if (createTaskMatch) {
    const title = cleanupTitle(text.slice(createTaskMatch.length));
    return {
      rawText: text,
      intent: "create_task",
      label: b.labels.create_task,
      summary: title
        ? locale === "ru" || locale === "uk"
          ? `Создать задачу «${title}».`
          : locale === "es"
            ? `Crear tarea «${title}».`
            : locale === "de"
              ? `Aufgabe «${title}» erstellen.`
              : `Create a task named "${title}".`
        : b.labels.create_task + (locale === "ru" ? " — нужен заголовок." : ""),
      title: title || undefined,
      description: inferDomainDescription(lower),
      confidence: title ? "high" : "low",
      evidence: [b.evidence.createMatched, b.evidence.confirmRequired, b.evidence.source],
      question: title ? undefined : b.taskTitleQuestion,
      quickReplies: title ? undefined : b.quick.task,
      advice: [b.advice.taskDeadline, b.advice.taskProject],
      executable: Boolean(title),
    };
  }

  const createProjectMatch = matchCreate(lower, projectPhrases);
  if (createProjectMatch) {
    const title = cleanupTitle(text.slice(createProjectMatch.length));
    return {
      rawText: text,
      intent: "create_project",
      label: b.labels.create_project,
      summary: title
        ? locale === "ru" || locale === "uk"
          ? `Создать проект «${title}».`
          : locale === "es"
            ? `Crear proyecto «${title}».`
            : locale === "de"
              ? `Projekt «${title}» erstellen.`
              : `Create a project named "${title}".`
        : b.labels.create_project,
      title: title || undefined,
      description: inferDomainDescription(lower),
      confidence: title ? "high" : "low",
      evidence: [b.evidence.createMatched, b.evidence.confirmRequired, b.evidence.source],
      question: title ? undefined : b.projectTitleQuestion,
      quickReplies: title ? undefined : b.quick.project,
      advice: [b.advice.projectOutcome, b.advice.projectTask],
      executable: Boolean(title),
    };
  }

  if (includesAny(lower, todayPhrases)) {
    return routePlan(
      "show_today",
      b.labels.show_today,
      locale === "ru" || locale === "uk"
        ? "Открыть Dashboard: фокус дня, риски и следующие шаги."
        : locale === "es"
          ? "Abrir Dashboard: enfoque, riesgos y acciones."
          : locale === "de"
            ? "Dashboard öffnen: Fokus, Risiken und nächste Schritte."
            : "Open Dashboard for today focus, risks, and next actions.",
      "/dashboard",
      "high",
      [b.evidence.helpToday, b.evidence.dashboardBrain],
      [b.advice.todayFocus, b.advice.todayInbox],
      text,
    );
  }

  if (includesAny(lower, riskPhrases)) {
    return routePlan(
      "show_risks",
      b.labels.show_risks,
      locale === "ru" || locale === "uk"
        ? "Открыть Projects для обзора рисков."
        : locale === "es"
          ? "Abrir Projects para revisar riesgos."
          : locale === "de"
            ? "Projects öffnen für Risikoübersicht."
            : "Open Projects risk context.",
      "/projects",
      "high",
      [b.evidence.riskPhrase, b.evidence.riskSurface],
      [b.advice.risksFirst, b.advice.riskOwner],
      text,
    );
  }

  if (includesAny(lower, searchPhrases)) {
    return routePlan(
      "search",
      b.labels.search,
      locale === "ru" || locale === "uk"
        ? "Открыть Dashboard и использовать глобальный поиск."
        : locale === "es"
          ? "Abrir Dashboard y usar búsqueda global."
          : locale === "de"
            ? "Dashboard öffnen und globale Suche nutzen."
            : "Open Dashboard and use global search.",
      "/dashboard",
      "medium",
      [b.evidence.searchPhrase, b.evidence.searchShell],
      [b.evidence.searchShell],
      text,
    );
  }

  if (includesAny(lower, notePhrases)) {
    const title = cleanupTitle(
      text.replace(/^(note|idea|remember|заметка|идея|запиши|мысль|nota|idee|notiz)/i, ""),
    );
    return {
      rawText: text,
      intent: "draft_note",
      label: b.labels.draft_note,
      summary:
        locale === "ru" || locale === "uk"
          ? "Заметка сохранена как черновик."
          : locale === "es"
            ? "Nota guardada como borrador."
            : locale === "de"
              ? "Notiz als Entwurf gespeichert."
              : "Note drafted here.",
      title: title || text,
      confidence: "medium",
      evidence: [b.evidence.notePhrase, b.evidence.noteNotConnected],
      question:
        locale === "ru" || locale === "uk"
          ? "Оставить заметкой, сделать задачей или привязать к проекту?"
          : locale === "es"
            ? "¿Nota, tarea o proyecto?"
            : locale === "de"
              ? "Notiz, Aufgabe oder Projekt?"
              : "Note, task, or project?",
      quickReplies: b.quick.note,
      advice: [b.advice.noteTypes, b.advice.noteProject],
      executable: false,
    };
  }

  if (includesAny(lower, reminderPhrases)) {
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
      rawText: text,
      intent: "draft_reminder",
      label: b.labels.draft_reminder,
      summary:
        locale === "ru" || locale === "uk"
          ? "Напоминание сохранено как черновик."
          : locale === "es"
            ? "Recordatorio guardado como borrador."
            : locale === "de"
              ? "Erinnerung als Entwurf gespeichert."
              : "Reminder drafted for later.",
      title: text,
      confidence: hasTimeSignal ? "medium" : "low",
      evidence: [b.evidence.reminderPhrase, b.evidence.reminderNotConnected],
      question: hasTimeSignal ? undefined : b.reminderTimeQuestion,
      quickReplies: hasTimeSignal ? undefined : b.quick.reminder,
      advice: [b.advice.reminderDraft, b.advice.reminderTime],
      executable: false,
    };
  }

  const routeHit = VOICE_ROUTES.find((item) =>
    includesAny(lower, [
      ...item.words.en,
      ...item.words[locale],
      ...b.openPrefix.map((p) => `${p} ${item.labels[locale].toLowerCase()}`),
    ]),
  );
  if (routeHit) {
    const label = routeHit.labels[locale];
    return routePlan(
      "open_route",
      label,
      locale === "ru" || locale === "uk"
        ? `Перейти: ${label}.`
        : locale === "es"
          ? `Ir a ${label}.`
          : locale === "de"
            ? `Öffne ${label}.`
            : `Navigate to ${label}.`,
      routeHit.route,
      "high",
      [b.evidence.routeKeywords, b.evidence.routeMap],
      [b.evidence.routeMap],
      text,
    );
  }

  return unknownPlan(text, b.unknownSummary, b);
}

function routePlan(
  intent: VoiceIntent,
  label: string,
  summary: string,
  route: string,
  confidence: VoicePlan["confidence"],
  evidence: string[],
  advice?: string[],
  rawText?: string,
): VoicePlan {
  return { rawText, intent, label, summary, route, confidence, evidence, advice, executable: true };
}

function unknownPlan(text: string, summary: string, b: ReturnType<typeof voiceBundle>): VoicePlan {
  return {
    rawText: text,
    intent: "unknown",
    label: b.labels.unknown,
    summary,
    title: text || undefined,
    confidence: "low",
    evidence: [b.evidence.noIntent, b.evidence.tryPhrases],
    question: b.unknownQuestion,
    quickReplies: b.quick.unknown,
    advice: [b.advice.unknownSave, b.advice.unknownVerbs],
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
