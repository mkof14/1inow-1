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
import { createProjectRecord, createTaskRecord, deleteTaskRecord, updateTaskAssignee, updateTaskDueDate, updateTaskStatus } from "@/lib/project-task-engine";
import { sendMessage } from "@/lib/comm";
import type { Database } from "@/integrations/supabase/types";
import type { VoicePlan, VoiceIntent } from "@/lib/voice-actions";
import { voicePlanFromSenseAction } from "@/lib/voice-actions";
import { fillVoicePlanSlot, finalizeVoicePlanSlots, planAwaitingSlot } from "@/lib/voice-plan-slots";
import { createReminderRecord, readReminderSnapshot, updateReminderTime } from "@/lib/voice-reminder-engine";
import { extractMemoryTeach, saveMemoryTeach } from "@/lib/memory-engine";
import { updateDecisionStatus } from "@/lib/decision-engine";
import {
  type AdviceContext,
  extractTaskFromAdvice,
  isAdviceActionPhrase,
  planFromAdviceContext,
} from "@/lib/voice-advice-actions";
import { parseDecisionVoiceIntent } from "@/lib/voice-decision-actions";
import {
  convertInboxNoteToTask,
  fetchFirstNewNoteInboxItem,
  fetchFirstNewVoiceInboxItem,
  fetchNewVoiceInboxCount,
  isConvertInboxNotePhrase,
  isOpenVoiceInboxPhrase,
  isVoiceInboxCountQuestion,
  processVoiceInboxItem,
  dismissVoiceInboxItem,
  voiceInboxStatMessage,
  type InboxProcessAction,
} from "@/lib/voice-inbox-actions";
import {
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markFirstUnreadNotificationRead,
} from "@/lib/voice-notification-actions";
import {
  extractReminderTitle,
  formatReminderTime,
  parseReminderDateTime,
  parseReminderUtterance,
  utteranceHasReminderSchedule,
} from "@/lib/voice-reminder-time";
import { formatDueDateLabel, parseDueDateFromText } from "@/lib/voice-due-date";
import { logVoiceAction } from "@/lib/voice-audit";
import {
  enqueueOfflineVoiceAction,
  flushOfflineVoiceQueue,
  isVoiceOffline,
} from "@/lib/voice-offline-queue";
import { enrichVoicePlan, extractSearchQuery } from "@/lib/voice-entity-resolver";
import { SENSE_ASSETS, SENSE_NAME } from "@/lib/sense-assets";
import { saveVoiceInboxItem, syncVoiceInboxIfNeeded, type VoiceInboxKind } from "@/lib/voice-intake";
import { useI18n } from "@/lib/i18n";
import { useVoiceSession, type VoiceSessionApi } from "@/hooks/use-voice-session";
import { VoiceUnifiedConsole } from "@/components/voice/voice-unified-console";
import { loadVoicePrefs } from "@/lib/voice-prefs";
import { resolveSpeechText } from "@/lib/voice-speakable";
import { isConfirmPhrase } from "@/lib/voice-control-phrases";
import { resolveResponseLang, isLikelyQuestion } from "@/lib/voice-locale";
import { fetchSenseAnswer } from "@/lib/voice-chat-client";
import { useAiPageContext } from "@/lib/ai-context";
import type { PageContext } from "@/lib/ai-context";
import {
  applyPageContextToPlan,
  extractAssignToThisPersonTask,
  extractCreateTaskHereTitle,
  isAssignToThisPersonPhrase,
  isCompleteFirstTaskPhrase,
  isCreateTaskHerePhrase,
  isCreateTaskOnBoardPhrase,
  isOpenFirstProjectPhrase,
} from "@/lib/voice-page-context";
import {
  isRepeatLastCommandPhrase,
  loadLastExecutedVoicePlan,
  saveLastExecutedVoicePlan,
} from "@/lib/voice-last-command";
import { isBatchUtterance, splitBatchUtterance } from "@/lib/voice-batch";
import { batchStepUndoLabel, buildBatchUndoLabel } from "@/lib/voice-batch-labels";
import {
  fetchLearningStats,
  focusIntelligenceTab,
  isAssistantMemoryEnabled,
  isLearningSummaryPhrase,
  isShowLearningQuestionsPhrase,
  isShowMemoriesPhrase,
  learningStatsMessage,
} from "@/lib/voice-learning";
import { executeVoiceUndo } from "@/lib/voice-undo-engine";
import {
  isUndoLastActionPhrase,
  isUndoBatchPhrase,
  saveVoiceUndo,
  startVoiceUndoBatch,
  finishVoiceUndoBatch,
  cancelVoiceUndoBatch,
} from "@/lib/voice-undo";
import { extractSearchProjectsQuery, extractProjectStatusFilter, isFilterProjectsByStatusPhrase, isSearchProjectsPhrase, isShowProjectsGridPhrase, isShowProjectsRiskPhrase, isShowProjectsTablePhrase } from "@/lib/voice-projects-actions";
import {
  cancelUpcomingReminder,
  cancelReminderExactOnly,
  extractCancelReminderTitle,
  extractRescheduleReminderTitle,
  extractSnoozeReminderTitle,
  fetchFirstUpcomingReminder,
  fetchUpcomingReminders,
  isCancelReminderPhrase,
  isReminderCountQuestion,
  isRescheduleReminderPhrase,
  isShowRemindersPhrase,
  isSnoozeReminderPhrase,
  reminderListMessage,
} from "@/lib/voice-reminder-actions";
import {
  extractSearchFilesQuery,
  filesSearchStubMessage,
  isSearchFilesPhrase,
} from "@/lib/voice-files-actions";
import {
  extractOpenTeamPersonName,
  extractTeamMapFilter,
  isFilterTeamMapPhrase,
  isOpenTeamPersonPhrase,
} from "@/lib/voice-team-actions";
import {
  extractOpenPersonName,
  fetchWaitingStats,
  fetchWorkspaceTaskStats,
  isBlockedTasksPhrase,
  isOpenPersonPhrase,
  isOverdueTasksPhrase,
  isWaitingCountQuestion,
  isWaitingPhrase,
  isWorkspaceCountQuestion,
  waitingStatMessage,
  workspaceStatMessage,
} from "@/lib/voice-workspace-stats";
import { buildPerspectiveSpeech, toVoiceLocale, voiceBundle, VOICE_ROUTES } from "@/lib/voice-i18n";
import {
  extractSendMessageBody,
  extractSendMessageTarget,
  isSendMessagePhrase,
} from "@/lib/voice-comm-actions";

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

export type { VoiceSessionApi };

export function VoiceCommandCenter({
  open: controlledOpen,
  onOpenChange,
  showLauncher = true,
  embedded = false,
  sharedVoice,
  bridgeRef,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showLauncher?: boolean;
  embedded?: boolean;
  sharedVoice?: VoiceSessionApi;
  bridgeRef?: React.MutableRefObject<VoiceCommandsBridge | null>;
}) {
  if (embedded) {
    if (!sharedVoice) return null;
    return (
      <VoiceCommandsCore
        voice={sharedVoice}
        bridgeRef={bridgeRef}
        embedded
        onClosePanel={undefined}
        controlledOpen={false}
        onOpenChange={undefined}
        showLauncher={false}
      />
    );
  }
  return (
    <VoiceCommandCenterShell
      open={controlledOpen}
      onOpenChange={onOpenChange}
      showLauncher={showLauncher}
    />
  );
}

export type VoiceCommandsBridge = {
  onAutoSend: (utterance: string) => void;
  onTranscript: (value: string, final: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  executePlan?: (plan: VoicePlan) => Promise<void>;
  repeatLast?: () => void;
};

function VoiceCommandCenterShell({
  open: controlledOpen,
  onOpenChange,
  showLauncher = true,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showLauncher?: boolean;
}) {
  const { t, lang, setLang } = useI18n();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [busy, setBusy] = useState(false);
  const analyzeRef = useRef<(value?: string) => Promise<void>>(async () => {});
  const onTranscriptRef = useRef<(value: string, final: boolean) => void>(() => {});
  const executeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planRef = useRef<VoicePlan | null>(null);
  const voiceControlRef = useRef<(action: import("@/lib/voice-control-phrases").VoiceControlAction) => void>(
    () => {},
  );

  const voice = useVoiceSession({
    lang,
    continuous: true,
    conversationMode: true,
    autoSend: true,
    onTranscript: (value, final) => onTranscriptRef.current(value, final),
    onLangDetected: (detected) => {
      if (detected !== lang) setLang(detected);
    },
    onAutoSend: (utterance) => {
      void analyzeRef.current(utterance);
    },
    onVoiceControl: (action) => {
      voiceControlRef.current(action);
    },
  });

  const voiceLabels = {
    micOn: t("voice.mic.on"),
    micOff: t("voice.mic.off"),
    speakerOn: t("voice.speaker.on"),
    speakerOff: t("voice.speaker.off"),
    listening: t("voice.status.listening"),
    transcribing: t("voice.status.transcribing"),
    speaking: t("voice.status.speaking"),
    idle: t("voice.status.idle"),
    handsFree: t("voice.status.handsFree"),
    tapMic: t("voice.tapMic", "Tap mic to start"),
    stop: t("voice.stop", "Stop"),
    bargeIn: t("voice.bargeIn"),
    thinking: t("common.thinking"),
    tabChat: t("voice.tab.chat"),
    tabCommands: t("voice.tab.commands"),
    novaRole: t("voice.nova.role"),
    veraRole: t("voice.vera.role"),
    micIn: t("voice.meter.mic"),
    speakerOut: t("voice.meter.out"),
    meterIn: t("voice.meter.mic"),
    meterOut: t("voice.meter.out"),
    meterLive: t("voice.meter.live"),
    meterQuiet: t("voice.meter.quiet"),
    fnHandsFree: t("voice.fn.handsFree"),
    fnAutoSend: t("voice.fn.autoSend"),
    fnBargeIn: t("voice.fn.bargeIn"),
    novaSpeaking: t("voice.status.novaSpeaking"),
    veraSpeaking: t("voice.status.veraSpeaking"),
    novaListening: t("voice.status.novaListening"),
    veraListening: t("voice.status.veraListening"),
  };

  const handleVoiceStop = useCallback(() => {
    if (executeTimerRef.current) clearTimeout(executeTimerRef.current);
    voice.stopSpeaking();
  }, [voice.stopSpeaking]);

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
          if (!value) void voice.stopConversation();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={SENSE_ASSETS.sense} alt="" className="size-7 rounded-xl" />
              {SENSE_NAME} Voice Center
            </DialogTitle>
          </DialogHeader>

          <VoiceUnifiedConsole
            phase={voice.phase}
            lang={lang}
            micStream={voice.micStream}
            speakerOn={voice.speakerOn}
            speakingAudio={voice.speakingAudio}
            error={voice.error}
            handsFreeActive={voice.handsFreeActive}
            conversationMode={voice.conversationMode}
            thinking={busy}
            activePersona={voice.activePersona}
            mode="commands"
            onToggleMic={voice.toggleMic}
            onToggleSpeaker={voice.toggleSpeaker}
            onStop={handleVoiceStop}
            labels={voiceLabels}
            className="mb-4"
          />

          <VoiceCommandsCore
            voice={voice}
            embedded={false}
            controlledOpen={open}
            onOpenChange={setOpen}
            showLauncher={false}
            analyzeRef={analyzeRef}
            onTranscriptRef={onTranscriptRef}
            executeTimerRef={executeTimerRef}
            planRef={planRef}
            voiceControlRef={voiceControlRef}
            onBusyChange={setBusy}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function VoiceCommandsCore({
  voice,
  embedded = false,
  bridgeRef,
  onClosePanel,
  controlledOpen,
  onOpenChange,
  showLauncher: _showLauncher,
  analyzeRef: externalAnalyzeRef,
  onTranscriptRef: externalTranscriptRef,
  executeTimerRef: externalExecuteTimerRef,
  planRef: externalPlanRef,
  voiceControlRef: externalVoiceControlRef,
  onBusyChange,
}: {
  voice: VoiceSessionApi;
  embedded?: boolean;
  bridgeRef?: React.MutableRefObject<VoiceCommandsBridge | null>;
  onClosePanel?: () => void;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showLauncher?: boolean;
  analyzeRef?: React.MutableRefObject<(value?: string) => Promise<void>>;
  onTranscriptRef?: React.MutableRefObject<(value: string, final: boolean) => void>;
  executeTimerRef?: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  planRef?: React.MutableRefObject<VoicePlan | null>;
  voiceControlRef?: React.MutableRefObject<
    (action: import("@/lib/voice-control-phrases").VoiceControlAction) => void
  >;
  onBusyChange?: (busy: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang, setLang } = useI18n();
  const { context: pageContext } = useAiPageContext();
  const [internalOpen, setInternalOpen] = useState(false);
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
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<VoicePlan | null>(null);
  const localAnalyzeRef = useRef<(value?: string) => Promise<void>>(async () => {});
  const localTranscriptRef = useRef<(value: string, final: boolean) => void>(() => {});
  const localExecuteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPlanRef = useRef<VoicePlan | null>(null);
  const analyzeRef = externalAnalyzeRef ?? localAnalyzeRef;
  const onTranscriptRef = externalTranscriptRef ?? localTranscriptRef;
  const executeTimerRef = externalExecuteTimerRef ?? localExecuteTimerRef;
  const planRef = externalPlanRef ?? localPlanRef;
  planRef.current = plan;
  const lastAdviceRef = useRef<AdviceContext | null>(null);

  useEffect(() => {
    if (plan?.senseReply) {
      lastAdviceRef.current = { senseReply: plan.senseReply, summary: plan.summary };
    }
  }, [plan?.senseReply, plan?.summary]);

  useEffect(() => {
    void syncVoiceInboxIfNeeded().then((synced) => {
      if (synced) void queryClient.invalidateQueries({ queryKey: ["voice-inbox"] });
    });
  }, [queryClient]);

  const remember = useCallback((done: VoicePlan) => {
    setHistory((items) =>
      [done, ...items.filter((item) => item.summary !== done.summary)].slice(0, 6),
    );
  }, []);

  const runExecuteRef = useRef<(targetPlan: VoicePlan) => Promise<void>>(async () => {});

  const runExecute = useCallback(
    async (targetPlan: VoicePlan) => {
      if (executeTimerRef.current) clearTimeout(executeTimerRef.current);
      const toasts = voiceBundle(lang, text).toasts;

      if (voicePlanNeedsNetwork(targetPlan.intent) && isVoiceOffline()) {
        enqueueOfflineVoiceAction(targetPlan, targetPlan.rawText ?? text, lang);
        void logVoiceAction(targetPlan, "queued");
        toast.info(
          lang.startsWith("ru") || lang.startsWith("uk")
            ? "Offline — команда в очереди"
            : "Offline — command queued",
        );
        return;
      }

      setBusy(true);
      try {
        if (targetPlan.intent === "repeat_last_command") {
          const last = loadLastExecutedVoicePlan();
          if (!last) {
            toast.message(
              lang.startsWith("ru") || lang.startsWith("uk")
                ? "Нет последней команды"
                : "No last command to repeat",
            );
            return;
          }
          await runExecuteRef.current(last);
          return;
        }

        if (targetPlan.intent === "undo_last_action") {
          const result = await executeVoiceUndo(lang);
          if (result.ok) {
            await queryClient.invalidateQueries({ queryKey: ["tasks"] });
            await queryClient.invalidateQueries({ queryKey: ["projects"] });
            await queryClient.invalidateQueries({ queryKey: ["decisions"] });
            await queryClient.invalidateQueries({ queryKey: ["messages"] });
            await queryClient.invalidateQueries({ queryKey: ["ai_reminders"] });
            toast.success(result.message);
            void logVoiceAction(targetPlan, "executed");
          } else {
            toast.message(result.message);
          }
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_blocked" || targetPlan.intent === "show_overdue") {
          const statFromEvidence = targetPlan.evidence?.find((e) =>
            ["overdue", "blocked", "open"].includes(e),
          ) as "overdue" | "blocked" | "open" | undefined;
          const kind =
            statFromEvidence ??
            (targetPlan.intent === "show_blocked" ? "blocked" : "overdue");
          const stats = await fetchWorkspaceTaskStats();
          const message = workspaceStatMessage(kind, stats, lang);
          toast.message(message);
          if (voice.speakerOn) {
            const spoken = resolveSpeechText(message);
            if (spoken) void voice.speakText(spoken, lang);
          }
          if (!targetPlan.speakOnly) {
            navigate({ to: "/tasks" as any, search: { filter: kind } as any });
            window.dispatchEvent(
              new CustomEvent("1inow:tasks-focus", { detail: { filter: kind } }),
            );
          }
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_waiting") {
          const { data: authData } = await supabase.auth.getUser();
          const stats = await fetchWaitingStats(authData.user?.id);
          const focus = targetPlan.searchQuery === "all" ? "all" : "me";
          const message = waitingStatMessage(stats, lang, focus);
          toast.message(message);
          if (voice.speakerOn) {
            const spoken = resolveSpeechText(message);
            if (spoken) void voice.speakText(spoken, lang);
          }
          if (!targetPlan.speakOnly) {
            if (stats.forMe > 0) {
              navigate({ to: "/tasks" as any, search: { filter: "review" } as any });
              window.dispatchEvent(
                new CustomEvent("1inow:tasks-focus", { detail: { filter: "review" } }),
              );
            } else if (stats.approvals > 0) {
              navigate({ to: "/approvals" as any });
            } else {
              navigate({ to: "/dashboard" as any });
            }
          }
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_voice_inbox") {
          const count = await fetchNewVoiceInboxCount();
          const message = voiceInboxStatMessage(count, lang);
          toast.message(message);
          if (voice.speakerOn) {
            const spoken = resolveSpeechText(message);
            if (spoken) void voice.speakText(spoken, lang);
          }
          if (!targetPlan.speakOnly) {
            navigate({ to: "/inbox" as any });
            window.dispatchEvent(new CustomEvent("1inow:inbox-focus", { detail: { tab: "voice" } }));
          }
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "convert_inbox_note") {
          const item = await fetchFirstNewNoteInboxItem();
          if (!item) {
            toast.message(
              lang.startsWith("ru") || lang.startsWith("uk")
                ? "Нет новых заметок в Voice Inbox"
                : "No new notes in Voice Inbox",
            );
            return;
          }
          const result = await convertInboxNoteToTask(item);
          if (result.entityId) {
            saveVoiceUndo({
              kind: "delete_task",
              taskId: result.entityId,
              label: item.title || "note task",
            });
          }
          await queryClient.invalidateQueries({ queryKey: ["voice-inbox"] });
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Задача из заметки: ${item.title}`
              : `Task from note: ${item.title}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "search") {
          window.dispatchEvent(
            new CustomEvent("1inow:open-search", {
              detail: { query: targetPlan.searchQuery ?? "" },
            }),
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_projects_risk") {
          navigate({ to: "/projects" as any, search: { view: "risk" } as any });
          window.dispatchEvent(
            new CustomEvent("1inow:projects-focus", { detail: { view: "risk" } }),
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_projects_table") {
          navigate({ to: "/projects" as any, search: { view: "table" } as any });
          window.dispatchEvent(
            new CustomEvent("1inow:projects-focus", { detail: { view: "table" } }),
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_projects_grid") {
          navigate({ to: "/projects" as any, search: { view: "grid" } as any });
          window.dispatchEvent(
            new CustomEvent("1inow:projects-focus", { detail: { view: "grid" } }),
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "filter_team_map") {
          const search: Record<string, string> = {};
          if (targetPlan.teamMapStatus) search.status = targetPlan.teamMapStatus;
          if (targetPlan.teamMapTimezone) search.timezone = targetPlan.teamMapTimezone;
          navigate({ to: "/team-map" as any, search: search as any });
          window.dispatchEvent(
            new CustomEvent("1inow:team-map-focus", {
              detail: {
                status: targetPlan.teamMapStatus,
                timezone: targetPlan.teamMapTimezone ?? "",
              },
            }),
          );
          const filterBits = [
            targetPlan.teamMapStatus,
            targetPlan.teamMapTimezone ? `TZ ${targetPlan.teamMapTimezone}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
          toast.message(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Фильтр карты: ${filterBits || "сброшен"}`
              : `Team map filter: ${filterBits || "cleared"}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "search_files") {
          navigate({
            to: "/files" as any,
            search: targetPlan.searchQuery ? ({ q: targetPlan.searchQuery } as any) : ({} as any),
          });
          if (targetPlan.searchQuery) {
            window.dispatchEvent(
              new CustomEvent("1inow:files-focus", {
                detail: { query: targetPlan.searchQuery, toast: true },
              }),
            );
          } else {
            toast.message(filesSearchStubMessage(lang));
          }
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (
          (targetPlan.intent === "reschedule_reminder" || targetPlan.intent === "snooze_reminder") &&
          targetPlan.reminderTime
        ) {
          let reminderId = targetPlan.entityId;
          let label = targetPlan.title;
          if (!reminderId) {
            const hit = await fetchFirstUpcomingReminder(targetPlan.title);
            if (!hit) {
              toast.message(
                lang.startsWith("ru") || lang.startsWith("uk")
                  ? "Нет напоминания для переноса"
                  : "No reminder to reschedule",
              );
              return;
            }
            reminderId = hit.id;
            label = hit.title;
          }
          const snap = await readReminderSnapshot(reminderId);
          await updateReminderTime(reminderId, targetPlan.reminderTime);
          saveVoiceUndo({
            kind: "restore_reminder_time",
            reminderId: snap.id,
            reminderTime: snap.reminder_time,
            label: snap.title,
          });
          await queryClient.invalidateQueries({ queryKey: ["ai_reminders"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? targetPlan.intent === "snooze_reminder"
                ? `Отложено: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`
                : `Перенесено: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`
              : lang.startsWith("es")
                ? targetPlan.intent === "snooze_reminder"
                  ? `Pospuesto: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`
                  : `Reprogramado: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`
                : lang.startsWith("de")
                  ? targetPlan.intent === "snooze_reminder"
                    ? `Verschoben: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`
                    : `Verschoben: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`
                  : targetPlan.intent === "snooze_reminder"
                    ? `Snoozed: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`
                    : `Rescheduled: ${label} · ${formatReminderTime(targetPlan.reminderTime, lang)}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "cancel_reminder") {
          const exactOnly = cancelReminderExactOnly(targetPlan.rawText ?? text);
          const canceled = await cancelUpcomingReminder(targetPlan.title, { exactOnly });
          if (!canceled) {
            toast.message(
              lang.startsWith("ru") || lang.startsWith("uk")
                ? exactOnly
                  ? "Напоминание с таким названием не найдено"
                  : "Нет напоминаний для отмены"
                : exactOnly
                  ? "No reminder with that exact title"
                  : "No reminder to cancel",
            );
            return;
          }
          saveVoiceUndo({
            kind: "restore_reminder_status",
            reminderId: canceled.id,
            status: "pending",
            label: canceled.title,
          });
          await queryClient.invalidateQueries({ queryKey: ["ai_reminders"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Отменено: ${canceled.title}`
              : `Canceled: ${canceled.title}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "filter_projects") {
          const status = targetPlan.searchQuery;
          navigate({
            to: "/projects" as any,
            search: status ? ({ status } as any) : ({} as any),
          });
          if (status) {
            window.dispatchEvent(
              new CustomEvent("1inow:projects-focus", { detail: { status } }),
            );
          }
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (
          targetPlan.intent === "show_memories" ||
          targetPlan.intent === "show_learning_questions"
        ) {
          const tab = targetPlan.intelligenceTab ?? (targetPlan.intent === "show_learning_questions" ? "questions" : "memory");
          const stats = await fetchLearningStats();
          const message = learningStatsMessage(stats, lang);
          toast.message(message);
          if (voice.speakerOn) {
            const spoken = resolveSpeechText(message);
            if (spoken) void voice.speakText(spoken, lang);
          }
          if (!targetPlan.speakOnly) {
            navigate({
              to: "/intelligence" as any,
              search: tab === "memory" ? ({} as any) : ({ tab } as any),
            });
            focusIntelligenceTab(tab as "memory" | "questions");
          }
          await queryClient.invalidateQueries({ queryKey: ["ai_memories"] });
          await queryClient.invalidateQueries({ queryKey: ["ai_questions"] });
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_reminders") {
          const items = await fetchUpcomingReminders();
          const message = reminderListMessage(items, lang);
          toast.message(message);
          if (voice.speakerOn) {
            const spoken = resolveSpeechText(message);
            if (spoken) void voice.speakText(spoken, lang);
          }
          if (!targetPlan.speakOnly) {
            navigate({ to: "/intelligence" as any, search: { tab: "reminders" } as any });
            focusIntelligenceTab("reminders");
          }
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "search_projects") {
          const query = targetPlan.searchQuery ?? "";
          navigate({
            to: "/projects" as any,
            search: query ? ({ q: query } as any) : ({} as any),
          });
          window.dispatchEvent(
            new CustomEvent("1inow:projects-focus", {
              detail: { query },
            }),
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (
          targetPlan.intent === "open_route" ||
          targetPlan.intent === "show_today" ||
          targetPlan.intent === "show_risks" ||
          targetPlan.intent === "open_project" ||
          targetPlan.intent === "open_task" ||
          targetPlan.intent === "open_person" ||
          targetPlan.intent === "open_team_person"
        ) {
          if (targetPlan.intent === "open_person") {
            navigate({ to: "/people" as any });
            if (targetPlan.title) {
              window.dispatchEvent(
                new CustomEvent("1inow:people-focus", {
                  detail: {
                    query: targetPlan.title,
                    personId: targetPlan.entityId,
                    personName: targetPlan.title,
                  },
                }),
              );
            }
          } else if (targetPlan.intent === "open_team_person") {
            navigate({ to: "/team-map" as any });
            if (targetPlan.entityId || targetPlan.title) {
              window.dispatchEvent(
                new CustomEvent("1inow:team-map-focus", {
                  detail: {
                    memberId: targetPlan.entityId,
                    memberName: targetPlan.title,
                    query: targetPlan.title,
                  },
                }),
              );
            }
            toast.message(
              lang.startsWith("ru") || lang.startsWith("uk")
                ? `На карте: ${targetPlan.title ?? ""}`
                : `On team map: ${targetPlan.title ?? ""}`,
            );
          } else {
            navigate({ to: (targetPlan.route ?? "/dashboard") as any });
          }
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          if (embedded) onClosePanel?.();
          else setOpen(false);
          return;
        }

        if (targetPlan.intent === "complete_task" && targetPlan.entityId) {
          const snap = await readTaskSnapshot(targetPlan.entityId);
          saveVoiceUndo({
            kind: "restore_task_status",
            taskId: targetPlan.entityId,
            status: snap.status,
            label: snap.title ?? targetPlan.title ?? "task",
          });
          await updateTaskStatus(targetPlan.entityId, "done");
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(lang.startsWith("ru") || lang.startsWith("uk") ? "Задача выполнена" : "Task completed");
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "update_task" && targetPlan.entityId) {
          const status = (targetPlan.taskStatus ?? "in_progress") as Database["public"]["Enums"]["task_status"];
          await updateTaskStatus(targetPlan.entityId, status);
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Статус задачи обновлён: ${status}`
              : `Task status updated: ${status}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "delete_task" && targetPlan.entityId) {
          await deleteTaskRecord(targetPlan.entityId);
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(lang.startsWith("ru") || lang.startsWith("uk") ? "Задача удалена" : "Task deleted");
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "assign_task" && targetPlan.entityId && targetPlan.assigneeId) {
          const snap = await readTaskSnapshot(targetPlan.entityId);
          saveVoiceUndo({
            kind: "restore_task_assignee",
            taskId: targetPlan.entityId,
            assigneeId: snap.assignee_id,
            label: snap.title ?? targetPlan.title ?? "task",
          });
          await updateTaskAssignee(targetPlan.entityId, targetPlan.assigneeId);
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Назначено: ${targetPlan.assigneeName ?? ""}`
              : `Assigned to ${targetPlan.assigneeName ?? "user"}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "reschedule_task" && targetPlan.entityId && targetPlan.dueDate) {
          const snap = await readTaskSnapshot(targetPlan.entityId);
          saveVoiceUndo({
            kind: "restore_task_due",
            taskId: targetPlan.entityId,
            dueDate: snap.due_date,
            label: snap.title ?? targetPlan.title ?? "task",
          });
          await updateTaskDueDate(targetPlan.entityId, targetPlan.dueDate);
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Дедлайн: ${formatDueDateLabel(targetPlan.dueDate, lang)}`
              : `Due ${formatDueDateLabel(targetPlan.dueDate, lang)}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "create_reminder" && targetPlan.title && targetPlan.reminderTime) {
          const created = await createReminderRecord({
            title: targetPlan.title,
            message: targetPlan.rawText ?? text,
            reminderTime: targetPlan.reminderTime,
          });
          saveVoiceUndo({
            kind: "delete_reminder",
            reminderId: created.id,
            label: created.title,
          });
          await queryClient.invalidateQueries({ queryKey: ["ai_reminders"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Напоминание: ${formatReminderTime(targetPlan.reminderTime, lang)}`
              : `Reminder set for ${formatReminderTime(targetPlan.reminderTime, lang)}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "process_inbox") {
          const item = await fetchFirstNewVoiceInboxItem();
          if (!item) {
            toast.message(lang.startsWith("ru") || lang.startsWith("uk") ? "Voice Inbox пуст" : "Voice Inbox is empty");
            return;
          }
          const result = await processVoiceInboxItem(item, (targetPlan.inboxAction ?? "auto") as InboxProcessAction);
          await queryClient.invalidateQueries({ queryKey: ["voice-inbox"] });
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          await queryClient.invalidateQueries({ queryKey: ["projects"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Inbox обработан: ${result.item.title}`
              : `Inbox processed: ${result.item.title}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "teach_memory") {
          if (!isAssistantMemoryEnabled()) {
            toast.message(
              lang.startsWith("ru") || lang.startsWith("uk")
                ? "Память отключена в Intelligence → Assistant"
                : lang.startsWith("es")
                  ? "Memoria desactivada en Intelligence → Assistant"
                  : lang.startsWith("de")
                    ? "Gedächtnis in Intelligence → Assistant deaktiviert"
                    : "Memory is disabled in Intelligence → Assistant",
            );
            return;
          }
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData.user?.id;
          if (!userId) throw new Error("Sign in required");
          const teach =
            extractMemoryTeach(targetPlan.rawText ?? text) ??
            (targetPlan.title && targetPlan.description
              ? {
                  key: targetPlan.title,
                  value: targetPlan.description,
                  type: (targetPlan.memoryType ?? "user_preference") as "user_preference",
                }
              : null);
          if (!teach) throw new Error("Could not parse memory");
          const message = await saveMemoryTeach({
            userId,
            key: teach.key,
            value: teach.value,
            type: teach.type,
            lang,
          });
          await queryClient.invalidateQueries({ queryKey: ["ai_memories"] });
          navigate({ to: "/intelligence" as any, search: {} as any });
          focusIntelligenceTab("memory");
          toast.success(message);
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "send_message" && targetPlan.entityId && targetPlan.description) {
          const msg = await sendMessage({
            channel_id: targetPlan.entityId,
            body: targetPlan.description,
          });
          saveVoiceUndo({
            kind: "delete_message",
            messageId: msg.id,
            label: targetPlan.description.slice(0, 60),
          });
          await queryClient.invalidateQueries({ queryKey: ["messages"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Отправлено в канал`
              : "Message sent",
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (
          (targetPlan.intent === "approve_decision" || targetPlan.intent === "reject_decision") &&
          targetPlan.entityId
        ) {
          const { data: decisionSnap } = await supabase
            .from("decisions")
            .select("status, title")
            .eq("id", targetPlan.entityId)
            .maybeSingle();
          const status = targetPlan.intent === "approve_decision" ? "approved" : "rejected";
          await updateDecisionStatus(targetPlan.entityId, status);
          if (decisionSnap?.status) {
            saveVoiceUndo({
              kind: "restore_decision_status",
              decisionId: targetPlan.entityId,
              status: decisionSnap.status,
              label: decisionSnap.title ?? targetPlan.title ?? "decision",
            });
          }
          await queryClient.invalidateQueries({ queryKey: ["decisions"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? status === "approved"
                ? `Одобрено: ${targetPlan.title ?? ""}`
                : `Отклонено: ${targetPlan.title ?? ""}`
              : `Decision ${status}: ${targetPlan.title ?? ""}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "mark_notifications_read") {
          const markAll = targetPlan.searchQuery === "all";
          if (markAll) {
            await markAllNotificationsRead();
            toast.success(
              lang.startsWith("ru") || lang.startsWith("uk")
                ? "Все уведомления прочитаны"
                : "All notifications marked read",
            );
          } else {
            const first = await markFirstUnreadNotificationRead();
            if (!first) {
              toast.message(
                lang.startsWith("ru") || lang.startsWith("uk")
                  ? "Нет непрочитанных"
                  : "No unread notifications",
              );
              return;
            }
            toast.success(
              lang.startsWith("ru") || lang.startsWith("uk")
                ? `Прочитано: ${first.title}`
                : `Marked read: ${first.title}`,
            );
          }
          await queryClient.invalidateQueries({ queryKey: ["notifications"] });
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "show_notifications") {
          const count = await fetchUnreadNotificationCount();
          const message =
            lang.startsWith("ru") || lang.startsWith("uk")
              ? count === 0
                ? "Нет непрочитанных уведомлений"
                : count === 1
                  ? "Одно непрочитанное уведомление"
                  : `${count} непрочитанных уведомлений`
              : count === 0
                ? "No unread notifications"
                : count === 1
                  ? "One unread notification"
                  : `${count} unread notifications`;
          toast.info(message);
          if (voice.speakerOn) void voice.speakText(message, lang);
          navigate({ to: "/inbox" as any });
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "dismiss_inbox") {
          const item = await fetchFirstNewVoiceInboxItem();
          if (!item) {
            toast.message(
              lang.startsWith("ru") || lang.startsWith("uk") ? "Voice Inbox пуст" : "Voice Inbox is empty",
            );
            return;
          }
          await dismissVoiceInboxItem(item);
          await queryClient.invalidateQueries({ queryKey: ["voice-inbox"] });
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Пропущено: ${item.title}`
              : `Dismissed: ${item.title}`,
          );
          void logVoiceAction(targetPlan, "executed");
          saveLastExecutedVoicePlan(targetPlan);
          remember(targetPlan);
          setText("");
          setPlan(null);
          return;
        }

        if (targetPlan.intent === "create_task" || targetPlan.intent === "create_from_advice") {
          const created = await createTaskRecord({
            title: targetPlan.title?.trim() || "Untitled task",
            description: targetPlan.description || null,
            projectId: targetPlan.projectId ?? null,
            dueDate: targetPlan.dueDate ?? null,
          });
          saveVoiceUndo({
            kind: "delete_task",
            taskId: created.id,
            label: targetPlan.title?.trim() || "task",
          });
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(toasts.taskCreated);
        } else if (targetPlan.intent === "create_project") {
          const created = await createProjectRecord({
            name: targetPlan.title?.trim() || "Untitled project",
            description: targetPlan.description || null,
          });
          saveVoiceUndo({
            kind: "delete_project",
            projectId: created.id,
            label: targetPlan.title?.trim() || "project",
          });
          await queryClient.invalidateQueries({ queryKey: ["projects"] });
          toast.success(toasts.projectCreated);
        } else if (targetPlan.intent === "draft_note" || targetPlan.intent === "draft_reminder") {
          const item = await saveVoiceInboxItem({
            raw: targetPlan.rawText ?? text,
            title: targetPlan.title || text,
            kind: mapPlanToInboxKind(targetPlan.intent),
            confidence: targetPlan.confidence,
            summary: targetPlan.summary,
          });
          if (item) {
            await queryClient.invalidateQueries({ queryKey: ["voice-inbox"] });
            toast.success(toasts.savedInbox);
          }
        } else {
          toast.message(toasts.notExecutable);
        }
        void logVoiceAction(targetPlan, "executed");
        saveLastExecutedVoicePlan(targetPlan);
        remember(targetPlan);
        setText("");
        setPlan(null);
        if (embedded) onClosePanel?.();
        else setOpen(false);
      } catch (error) {
        void logVoiceAction(targetPlan, "failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        if (voicePlanNeedsNetwork(targetPlan.intent) && isVoiceOffline()) {
          enqueueOfflineVoiceAction(targetPlan, targetPlan.rawText ?? text, lang);
          void logVoiceAction(targetPlan, "queued");
          toast.info(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? "Offline — команда в очереди"
              : "Offline — command queued",
          );
        } else {
          toast.error(error instanceof Error ? error.message : voiceBundle(lang, text).toasts.failed);
        }
      } finally {
        setBusy(false);
      }
    },
    [embedded, lang, navigate, onClosePanel, queryClient, remember, setOpen, text],
  );
  runExecuteRef.current = runExecute;

  useEffect(() => {
    const flush = () => {
      void flushOfflineVoiceQueue(async (item) => {
        await runExecuteRef.current(item.plan);
      }).then((result) => {
        if (result.flushed > 0) {
          toast.success(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? `Выполнено offline: ${result.flushed}`
              : `Ran ${result.flushed} queued command(s)`,
          );
        }
      });
    };
    window.addEventListener("online", flush);
    void flush();
    return () => window.removeEventListener("online", flush);
  }, [lang]);

  const handleVoiceControl = useCallback(
    (action: import("@/lib/voice-control-phrases").VoiceControlAction) => {
      if (executeTimerRef.current) clearTimeout(executeTimerRef.current);
      if (action === "cancel") {
        setText("");
        setPlan(null);
      }
      if (action === "confirm" && planRef.current?.executable) {
        void runExecuteRef.current(planRef.current);
      }
      if (action === "repeat_command") {
        const last = loadLastExecutedVoicePlan();
        if (!last) {
          toast.message(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? "Нет последней команды"
              : "No last command to repeat",
          );
          return;
        }
        void runExecuteRef.current(last);
      }
      if (action === "undo") {
        void runExecuteRef.current({
          rawText: "",
          intent: "undo_last_action",
          label: "Undo",
          summary: "Undo last action",
          confidence: "high",
          evidence: ["undo_last_action"],
          executable: true,
        });
      }
    },
    [executeTimerRef, lang, planRef],
  );

  useEffect(() => {
    if (externalVoiceControlRef) externalVoiceControlRef.current = handleVoiceControl;
  }, [externalVoiceControlRef, handleVoiceControl]);

  const scheduleAutoExecute = useCallback(
    (nextPlan: VoicePlan) => {
      if (executeTimerRef.current) clearTimeout(executeTimerRef.current);
      if (!loadVoicePrefs().autoExecute) return;
      if (nextPlan.destructive) return;
      if (!nextPlan.executable || nextPlan.confidence !== "high") return;
      executeTimerRef.current = setTimeout(() => {
        void runExecuteRef.current(nextPlan);
      }, 1200);
    },
    [executeTimerRef],
  );

  onTranscriptRef.current = (value, final) => {
    setText(value);
    if (final) {
      const responseLang = resolveResponseLang(lang, value);
      if (responseLang !== lang) setLang(responseLang);
    }
  };

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

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

  const analyze = useCallback(
    async (value = text) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const responseLang = resolveResponseLang(lang, trimmed);
      if (responseLang !== lang) setLang(responseLang);

      setBusy(true);
      try {
        if (planAwaitingSlot(planRef.current)) {
          let filled = fillVoicePlanSlot(planRef.current!, trimmed, responseLang);
          filled = await enrichVoicePlan(filled, trimmed, responseLang);
          filled = finalizeVoicePlanSlots(filled, responseLang);
          filled = applyPageContextToPlan(filled, pageContext, responseLang);
          setPlan(filled);
          scheduleAutoExecute(filled);
          if (voice.speakerOn && filled.summary) {
            const spoken = resolveSpeechText(filled.summary);
            if (spoken) void voice.speakText(spoken, responseLang);
          }
          return;
        }

        if (isBatchUtterance(trimmed)) {
          const batchParts = splitBatchUtterance(trimmed);
          let executed = 0;
          const stepUndoLabels: string[] = [];
          startVoiceUndoBatch();
          try {
            for (let i = 0; i < batchParts.length; i++) {
              const part = batchParts[i]!;
              let stepPlan = parseVoiceCommand(part, responseLang, lastAdviceRef.current, pageContext);
              stepPlan = await enrichVoicePlan(stepPlan, part, responseLang);
              stepPlan = finalizeVoicePlanSlots(stepPlan, responseLang);
              stepPlan = applyPageContextToPlan(stepPlan, pageContext, responseLang);

              const canAutoRun =
                stepPlan.executable &&
                stepPlan.confidence === "high" &&
                !stepPlan.destructive &&
                !planAwaitingSlot(stepPlan);

              if (!canAutoRun) {
                cancelVoiceUndoBatch();
                const ru = responseLang.startsWith("ru") || responseLang.startsWith("uk");
                setPlan({
                  ...stepPlan,
                  rawText: part,
                  summary: `${ru ? `Шаг ${i + 1}/${batchParts.length}` : responseLang.startsWith("es") ? `Paso ${i + 1}/${batchParts.length}` : responseLang.startsWith("de") ? `Schritt ${i + 1}/${batchParts.length}` : `Step ${i + 1}/${batchParts.length}`}: ${stepPlan.summary}`,
                });
                setText(part);
                scheduleAutoExecute(stepPlan);
                if (voice.speakerOn && stepPlan.summary) {
                  const spoken = resolveSpeechText(stepPlan.summary);
                  if (spoken) void voice.speakText(spoken, responseLang);
                }
                return;
              }

              await runExecuteRef.current(stepPlan);
              stepUndoLabels.push(batchStepUndoLabel(stepPlan, responseLang));
              executed++;
            }

            if (executed > 0) {
              finishVoiceUndoBatch(buildBatchUndoLabel(stepUndoLabels, responseLang));
            } else {
              cancelVoiceUndoBatch();
            }
          } catch (error) {
            cancelVoiceUndoBatch();
            throw error;
          }

          toast.success(
            responseLang.startsWith("ru") || responseLang.startsWith("uk")
              ? `Выполнено команд: ${executed}`
              : responseLang.startsWith("es")
                ? `Comandos ejecutados: ${executed}`
                : responseLang.startsWith("de")
                  ? `${executed} Befehle ausgeführt`
                  : `Ran ${executed} commands`,
          );
          setText("");
          setPlan(null);
          return;
        }

        let commandPlan = parseVoiceCommand(trimmed, responseLang, lastAdviceRef.current, pageContext);
        commandPlan = await enrichVoicePlan(commandPlan, trimmed, responseLang);
        commandPlan = finalizeVoicePlanSlots(commandPlan, responseLang);
        commandPlan = applyPageContextToPlan(commandPlan, pageContext, responseLang);

        const needsSense =
          commandPlan.intent === "unknown" ||
          isLikelyQuestion(trimmed) ||
          (commandPlan.confidence === "low" && !commandPlan.executable);

        if (needsSense) {
          const answer = await fetchSenseAnswer({
            prompt: trimmed,
            lang: responseLang,
            pageContext,
            voiceCommand: true,
          });
          if (answer?.text) {
            let nextPlan: VoicePlan;
            if (answer.action) {
              nextPlan = voicePlanFromSenseAction(answer.action, trimmed, responseLang);
              nextPlan = await enrichVoicePlan(nextPlan, trimmed, responseLang);
              nextPlan = finalizeVoicePlanSlots(nextPlan, responseLang);
              nextPlan = applyPageContextToPlan(nextPlan, pageContext, responseLang);
              nextPlan.senseReply = answer.text;
              nextPlan.conversational = !nextPlan.executable;
            } else {
              const summaryLine =
                (answer.speakText ?? answer.text).split("\n").find((line) => line.trim()) ??
                answer.text;
              nextPlan = {
                ...commandPlan,
                rawText: trimmed,
                intent: "unknown",
                label:
                  responseLang === "ru" || responseLang === "uk"
                    ? "Sense ответ"
                    : responseLang === "de"
                      ? "Sense-Antwort"
                      : responseLang === "es"
                        ? "Respuesta de Sense"
                        : "Sense answer",
                summary: summaryLine.slice(0, 240),
                senseReply: answer.text,
                conversational: true,
                confidence: "high",
                executable: false,
                evidence: [
                  answer.mode === "openai"
                    ? "Answer generated by Sense AI."
                    : "Answer generated by Sense (local mode).",
                  `Language: ${responseLang.toUpperCase()}`,
                ],
              };
            }
            setPlan(nextPlan);
            if (nextPlan.senseReply) {
              lastAdviceRef.current = { senseReply: nextPlan.senseReply, summary: nextPlan.summary };
            }
            if (voice.speakerOn) {
              const spoken = resolveSpeechText(answer.speakText ?? answer.text);
              if (spoken) void voice.speakText(spoken, responseLang);
            }
            scheduleAutoExecute(nextPlan);
            return;
          }
        }

        setPlan(commandPlan);
        scheduleAutoExecute(commandPlan);
        if (voice.speakerOn && (commandPlan.executable || commandPlan.summary)) {
          const spoken = resolveSpeechText(
            [commandPlan.summary, ...(commandPlan.advice ?? [])].filter(Boolean).join(" "),
          );
          if (spoken) void voice.speakText(spoken, responseLang);
        }
      } finally {
        setBusy(false);
      }
    },
    [lang, pageContext, scheduleAutoExecute, setLang, text, voice],
  );
  analyzeRef.current = analyze;

  useEffect(() => {
    if (!bridgeRef) return;
    bridgeRef.current = {
      onAutoSend: (utterance) => {
        if (isConfirmPhrase(utterance) && planRef.current?.executable) {
          void runExecuteRef.current(planRef.current);
          return;
        }
        void analyzeRef.current(utterance);
      },
      onTranscript: (value, final) => onTranscriptRef.current(value, final),
      onConfirm: () => {
        if (planRef.current?.executable) void runExecuteRef.current(planRef.current);
      },
      onCancel: () => {
        if (executeTimerRef.current) clearTimeout(executeTimerRef.current);
        setText("");
        setPlan(null);
      },
      executePlan: async (incoming) => {
        let next = await enrichVoicePlan({ ...incoming }, incoming.rawText ?? "", lang);
        next = finalizeVoicePlanSlots(next, lang);
        next = applyPageContextToPlan(next, pageContext, lang);
        setPlan(next);
        await runExecuteRef.current(next);
      },
      repeatLast: () => {
        const last = loadLastExecutedVoicePlan();
        if (!last) {
          toast.message(
            lang.startsWith("ru") || lang.startsWith("uk")
              ? "Нет последней команды"
              : "No last command to repeat",
          );
          return;
        }
        void runExecuteRef.current(last);
      },
    };
    return () => {
      bridgeRef.current = null;
    };
  }, [bridgeRef, analyzeRef, onTranscriptRef, planRef, executeTimerRef, lang, pageContext]);

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
    setPlan(parseVoiceCommand(nextText, lang, null, pageContext));
  };

  const execute = () => {
    if (plan) void runExecute(plan);
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

  const createFromAdvice = useCallback(() => {
    if (!plan?.senseReply) return;
    const built = planFromAdviceContext({ senseReply: plan.senseReply, summary: plan.summary }, lang);
    if (!built.ok) {
      toast.message(built.question);
      return;
    }
    const nextPlan: VoicePlan = {
      rawText: plan.rawText,
      intent: "create_from_advice",
      label: lang.startsWith("ru") || lang.startsWith("uk") ? "Задача из совета" : "Task from advice",
      title: built.title,
      summary: built.summary,
      confidence: "high",
      evidence: ["create_from_advice"],
      executable: true,
    };
    void runExecuteRef.current(nextPlan);
  }, [lang, plan]);

  return (
    <div className={cn("space-y-4", embedded && "min-h-0")}>
      <div className="rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft p-4">
        {!embedded && (
          <div className="mb-3">
            <div className="text-sm font-semibold">
              {t("voice.center.title", "Say or type what you want")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("voice.center.hint")}</p>
          </div>
        )}
        <Textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPlan(null);
          }}
          placeholder="Example: create task call Alex tomorrow, open projects, show risks..."
          rows={embedded ? 2 : 3}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {quickCommands.map((command) => (
            <button
              key={command.label}
              type="button"
              onClick={() => {
                setText(command.text);
                setPlan(parseVoiceCommand(command.text, lang, null, pageContext));
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
            {t("voice.center.novaLead", "Nova executes · Vera reviews before action")}
          </div>
          <Button type="button" size="sm" onClick={() => void analyze()} disabled={!text.trim() || busy}>
            {busy ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                {t("common.thinking")}
              </>
            ) : (
              "Understand"
            )}
          </Button>
        </div>
      </div>

      {plan && (
        <VoicePlanPreview
          plan={plan}
          busy={busy}
          lang={lang}
          onSpeak={(payload) => void voice.speakText(payload, lang)}
          onCancel={() => setPlan(null)}
          onCapture={captureToInbox}
          onConfirm={execute}
          onClarify={answerClarification}
          onCreateFromAdvice={createFromAdvice}
        />
      )}

      {!embedded && (
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
                    setPlan(parseVoiceCommand(example, lang, null, pageContext));
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
                    <div className="truncate text-[11px] text-muted-foreground">{item.summary}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No voice actions yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
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
  onCreateFromAdvice,
}: {
  plan: VoicePlan;
  busy: boolean;
  lang: string;
  onSpeak: (text: string) => void;
  onCancel: () => void;
  onCapture: () => void;
  onConfirm: () => void;
  onClarify: (answer: string) => void;
  onCreateFromAdvice?: () => void;
}) {
  const speakableSummary = resolveSpeechText(
    plan.senseReply ??
      [plan.summary, ...(plan.advice ?? [])].filter(Boolean).join(" "),
  );
  const perspectives = buildVoicePerspectives(plan, lang);
  const adviceTaskTitle = plan.senseReply ? extractTaskFromAdvice(plan.senseReply) : null;

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

      {plan.senseReply && (
        <div className="mb-3 rounded-xl border border-teal-500/25 bg-teal-500/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            Sense
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {plan.senseReply}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onSpeak(resolveSpeechText(plan.senseReply!))}
            >
              <Volume2 className="size-3.5" />
              Speak answer
            </Button>
            {adviceTaskTitle && onCreateFromAdvice && (
              <Button type="button" size="sm" className="gap-1.5" onClick={onCreateFromAdvice}>
                <CheckSquare className="size-3.5" />
                {lang.startsWith("ru") || lang.startsWith("uk")
                  ? "Создать задачу"
                  : "Create task"}
              </Button>
            )}
          </div>
        </div>
      )}

      {plan.conversational && perspectives.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {perspectives.map((p) => (
            <div
              key={p.persona}
              className={cn(
                "rounded-xl border p-3",
                p.persona === "Nova"
                  ? "border-amber-500/25 bg-amber-500/10"
                  : "border-indigo-500/25 bg-indigo-500/10",
              )}
            >
              <div className="flex items-center gap-2">
                <img src={p.image} alt="" className="size-7 rounded-lg" />
                <div>
                  <div className="text-xs font-semibold">{p.persona}</div>
                  <div className="text-[10px] text-muted-foreground">{p.role}</div>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      )}

      {plan.destructive && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-red-700 dark:text-red-300">
            <AlertTriangle className="size-3.5" />
            {lang.startsWith("ru") || lang.startsWith("uk") ? "Необратимое действие" : "Destructive action"}
          </div>
          <p className="mt-1 text-sm text-foreground">
            {lang.startsWith("ru") || lang.startsWith("uk")
              ? "Скажите «да» или нажмите подтверждение."
              : "Say yes or tap confirm to proceed."}
          </p>
        </div>
      )}

      {plan.taskStatus && plan.intent === "update_task" && (
        <div className="mb-3 rounded-xl border border-border bg-card/70 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Status</div>
          <div className="mt-1 text-sm font-medium">{plan.taskStatus}</div>
        </div>
      )}

      {plan.assigneeName && (
        <div className="mb-3 rounded-xl border border-border bg-card/70 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Assignee</div>
          <div className="mt-1 text-sm font-medium">{plan.assigneeName}</div>
        </div>
      )}

      {plan.dueDate && (
        <div className="mb-3 rounded-xl border border-border bg-card/70 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Due date</div>
          <div className="mt-1 text-sm font-medium">{formatDueDateLabel(plan.dueDate, lang)}</div>
        </div>
      )}

      {plan.reminderTime && (
        <div className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            {lang.startsWith("ru") || lang.startsWith("uk") ? "Напоминание" : "Reminder"}
          </div>
          <div className="mt-1 text-sm font-medium">{formatReminderTime(plan.reminderTime, lang)}</div>
        </div>
      )}

      {plan.pendingSlot && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            {lang.startsWith("ru") || lang.startsWith("uk") ? "Шаг" : "Step"}: {plan.pendingSlot}
          </span>
        </div>
      )}

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

      {!plan.conversational && plan.advice?.length ? (
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

      {!plan.conversational && speakableSummary && (
        <div className="mb-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
                Sense
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{speakableSummary}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => onSpeak(speakableSummary)}
            >
              <Volume2 className="size-3.5" />
              Speak
            </Button>
          </div>
        </div>
      )}

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
        <Button
          type="button"
          variant={plan.destructive ? "destructive" : "default"}
          onClick={plan.executable ? onConfirm : onCapture}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-1.5 size-4" />
          )}
          {plan.destructive
            ? lang.startsWith("ru") || lang.startsWith("uk")
              ? "Подтвердить удаление"
              : "Confirm delete"
            : plan.executable
              ? "Confirm action"
              : plan.question
                ? "Save unresolved"
                : "Save draft"}
        </Button>
      </div>
    </div>
  );
}

function mapPlanToInboxKind(intent: VoicePlan["intent"]): VoiceInboxKind {
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

function parseTaskStatusUpdate(
  lower: string,
  text: string,
  locale: ReturnType<typeof toVoiceLocale>,
): VoicePlan | null {
  const patterns: { re: RegExp; status: string; labelEn: string; labelRu: string }[] = [
    {
      re: /(?:start|begin|in progress|в работу|начать|начни|приступ)\s+(?:to\s+)?(?:the\s+)?(?:task|задач[уа]|задачу)\s+(.+)/,
      status: "in_progress",
      labelEn: "Start task",
      labelRu: "В работу",
    },
    {
      re: /(?:block|blocked|заблок|блок|застоп)\s+(?:the\s+)?(?:task|задач[уа]|задачу)\s+(.+)/,
      status: "blocked",
      labelEn: "Block task",
      labelRu: "Заблокировать",
    },
    {
      re: /(?:review|на проверк|ревью|reviewing)\s+(?:the\s+)?(?:task|задач[уа]|задачу)\s+(.+)/,
      status: "review",
      labelEn: "Review task",
      labelRu: "На проверку",
    },
    {
      re: /(?:todo|to do|к выполнению|в todo|верни в todo)\s+(?:the\s+)?(?:task|задач[уа]|задачу)\s+(.+)/,
      status: "todo",
      labelEn: "Move to todo",
      labelRu: "В todo",
    },
  ];

  for (const { re, status, labelEn, labelRu } of patterns) {
    const match = lower.match(re);
    if (!match?.[1]) continue;
    const name = cleanupTitle(match[1]);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "update_task",
      label: ru ? labelRu : labelEn,
      summary: ru ? `${labelRu}: «${name}»` : `${labelEn}: ${name}`,
      title: name,
      taskStatus: status,
      confidence: "medium",
      evidence: ["update_task", status],
      executable: false,
    };
  }
  return null;
}

function parseVoiceCommand(
  raw: string,
  uiLang = "en",
  adviceCtx?: AdviceContext | null,
  pageCtx?: PageContext,
): VoicePlan {
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

  const teach = extractMemoryTeach(text);
  if (teach && !/^(?:запомни\s+)?(?:мысль|идея|заметка)\b/i.test(lower)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "teach_memory",
      label: ru ? "Запомнить" : "Remember",
      summary: ru
        ? `Запомню: ${teach.value.slice(0, 100)}`
        : `Remember: ${teach.value.slice(0, 100)}`,
      title: teach.key,
      description: teach.value,
      memoryType: teach.type,
      confidence: "high",
      evidence: ["teach_memory"],
      executable: true,
    };
  }

  if (isAdviceActionPhrase(text) && adviceCtx?.senseReply) {
    const built = planFromAdviceContext(adviceCtx, uiLang);
    if (built.ok) {
      return {
        rawText: text,
        intent: "create_from_advice",
        label: locale === "ru" || locale === "uk" ? "Задача из совета" : "Task from advice",
        title: built.title,
        summary: built.summary,
        confidence: "high",
        evidence: ["create_from_advice", "sense_context"],
        executable: true,
      };
    }
    return {
      rawText: text,
      intent: "unknown",
      label: b.labels.unknown,
      summary: built.question,
      confidence: "low",
      evidence: ["create_from_advice", "missing_step"],
      question: built.question,
      executable: false,
      conversational: true,
    };
  }

  const decisionHit = parseDecisionVoiceIntent(text, locale);
  if (decisionHit) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: decisionHit.intent,
      label:
        decisionHit.intent === "approve_decision"
          ? ru
            ? "Одобрить решение"
            : "Approve decision"
          : ru
            ? "Отклонить решение"
            : "Reject decision",
      summary: decisionHit.title
        ? decisionHit.intent === "approve_decision"
          ? ru
            ? `Одобрить «${decisionHit.title}»`
            : `Approve ${decisionHit.title}`
          : ru
            ? `Отклонить «${decisionHit.title}»`
            : `Reject ${decisionHit.title}`
        : ru
          ? "Первое решение на согласовании"
          : "First pending decision",
      title: decisionHit.title,
      confidence: "medium",
      evidence: ["decision_voice"],
      executable: false,
      destructive: decisionHit.intent === "reject_decision",
    };
  }

  if (
    /(?:mark all|прочитай все|отметь все|позначити всі|marcar todas|alle.*markieren).*(?:notif|уведом|сповіщ|notificaci|benachricht)/i.test(
      lower,
    ) ||
    /(?:mark all notifications read|отметить все уведомления|marcar todas las notificaciones|alle benachrichtigungen gelesen)/i.test(
      lower,
    )
  ) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "mark_notifications_read",
      label: ru ? "Прочитать все" : "Mark all read",
      summary: ru ? "Отметить все уведомления прочитанными" : "Mark all notifications read",
      searchQuery: "all",
      confidence: "high",
      evidence: ["mark_notifications_read"],
      executable: true,
    };
  }

  if (
    /(?:mark|read|прочитай|отметь|познач).*(?:notif|уведом|сповіщ)/i.test(lower) ||
    /(?:notification read|уведомление прочитано)/i.test(lower)
  ) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "mark_notifications_read",
      label: ru ? "Прочитать уведомление" : "Mark notification read",
      summary: ru ? "Отметить первое непрочитанное" : "Mark first unread notification read",
      confidence: "high",
      evidence: ["mark_notifications_read"],
      executable: true,
    };
  }

  if (
    /(?:show|how many|сколько|покажи|скільки).*(?:notif|уведом|сповіщ)/i.test(lower) ||
    /(?:unread notifications|непрочитанные уведомления)/i.test(lower)
  ) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_notifications",
      label: ru ? "Уведомления" : "Notifications",
      summary: ru ? "Показать непрочитанные уведомления" : "Show unread notifications",
      confidence: "high",
      evidence: ["show_notifications"],
      executable: true,
    };
  }

  const countKind = isWorkspaceCountQuestion(text);
  if (countKind) {
    const ru = locale === "ru" || locale === "uk";
    const intent = countKind === "blocked" ? "show_blocked" : "show_overdue";
    return {
      rawText: text,
      intent,
      label: ru ? "Статистика" : "Workspace stats",
      summary: ru ? "Ответ по задачам" : "Task workspace answer",
      confidence: "high",
      evidence: ["workspace_stats", countKind],
      executable: true,
      speakOnly: true,
      conversational: true,
    };
  }

  if (isBlockedTasksPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_blocked",
      label: ru ? "Заблокированные" : "Blocked tasks",
      summary: ru ? "Показать заблокированные задачи" : "Show blocked tasks",
      route: "/tasks",
      confidence: "high",
      evidence: ["show_blocked"],
      executable: true,
    };
  }

  if (isOverdueTasksPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_overdue",
      label: ru ? "Просроченные" : "Overdue tasks",
      summary: ru ? "Показать просроченные задачи" : "Show overdue tasks",
      route: "/tasks",
      confidence: "high",
      evidence: ["show_overdue"],
      executable: true,
    };
  }

  if (isWaitingCountQuestion(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_waiting",
      label: ru ? "Ожидания" : "Waiting",
      summary: ru ? "Сколько ждёт вас" : "How much is waiting on you",
      confidence: "high",
      evidence: ["show_waiting", "count"],
      executable: true,
      speakOnly: true,
      conversational: true,
    };
  }

  if (isWaitingPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    const all = /(?:everyone|all waiting|все ожидан|всі очіку)/.test(lower);
    return {
      rawText: text,
      intent: "show_waiting",
      label: ru ? "Кто ждёт" : "Who is waiting",
      summary: ru ? "Показать, кто ждёт вас" : "Show what is waiting on you",
      route: "/dashboard",
      searchQuery: all ? "all" : "me",
      confidence: "high",
      evidence: ["show_waiting"],
      executable: true,
    };
  }

  if (isVoiceInboxCountQuestion(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_voice_inbox",
      label: ru ? "Voice Inbox" : "Voice Inbox",
      summary: ru ? "Сколько в Voice Inbox" : "Voice Inbox count",
      confidence: "high",
      evidence: ["show_voice_inbox", "count"],
      executable: true,
      speakOnly: true,
      conversational: true,
    };
  }

  if (isOpenVoiceInboxPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_voice_inbox",
      label: ru ? "Voice Inbox" : "Voice Inbox",
      summary: ru ? "Открыть Voice Inbox" : "Open Voice Inbox",
      route: "/inbox",
      confidence: "high",
      evidence: ["show_voice_inbox"],
      executable: true,
    };
  }

  if (isConvertInboxNotePhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "convert_inbox_note",
      label: ru ? "Заметка → задача" : "Note to task",
      summary: ru ? "Создать задачу из первой заметки" : "Create task from first note",
      confidence: "medium",
      evidence: ["convert_inbox_note"],
      executable: true,
    };
  }

  const sendTarget = extractSendMessageTarget(text);
  const sendBody = extractSendMessageBody(text);
  if (isSendMessagePhrase(text) || sendTarget || (pageCtx?.scope === "channel" && sendBody)) {
    const ru = locale === "ru" || locale === "uk";
    const body = sendBody || sendTarget?.body || "";
    const hasChannel = Boolean(pageCtx?.ids?.channelId || sendTarget?.channelName);
    return {
      rawText: text,
      intent: "send_message",
      label: ru ? "Отправить сообщение" : "Send message",
      summary: body
        ? ru
          ? `Отправить: «${body.slice(0, 80)}»`
          : `Send: ${body.slice(0, 80)}`
        : ru
          ? "Отправить сообщение в канал"
          : "Send channel message",
      description: body || undefined,
      title: sendTarget?.channelName,
      entityId: pageCtx?.ids?.channelId,
      confidence: body && hasChannel ? "high" : body ? "medium" : "low",
      evidence: ["send_message"],
      executable: Boolean(body && hasChannel),
      question: !body
        ? ru
          ? "Что отправить?"
          : "What should I send?"
        : !hasChannel
          ? ru
            ? "В какой канал?"
            : "Which channel?"
          : undefined,
    };
  }

  if (isOpenTeamPersonPhrase(text)) {
    const name = extractOpenTeamPersonName(text);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "open_team_person",
      label: ru ? "Найти на карте" : locale === "uk" ? "Знайти на карті" : "Find on team map",
      summary: name
        ? ru
          ? `Найти «${name}» на карте команды`
          : locale === "uk"
            ? `Знайти «${name}» на карті команди`
            : `Find ${name} on team map`
        : ru
          ? "Найти человека на карте"
          : "Find person on team map",
      title: name || undefined,
      route: "/team-map",
      confidence: name ? "medium" : "low",
      evidence: ["open_team_person"],
      executable: Boolean(name),
      question: name ? undefined : ru ? "Кого найти?" : "Who should I find?",
      pendingSlot: name ? undefined : "title",
    };
  }

  if (isOpenPersonPhrase(text)) {
    const name = extractOpenPersonName(text);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "open_person",
      label: ru ? "Открыть человека" : "Open person",
      summary: name
        ? ru
          ? `Найти «${name}» в людях`
          : `Find ${name} in People`
        : ru
          ? "Открыть людей"
          : "Open People",
      title: name || undefined,
      route: "/people",
      confidence: name ? "medium" : "low",
      evidence: ["open_person"],
      executable: Boolean(name),
      question: name ? undefined : ru ? "Кого найти?" : "Who should I find?",
      pendingSlot: name ? undefined : "title",
    };
  }

  if (
    /(?:skip|dismiss|ignore|пропусти|убери|отложи|скасуй|omitir|saltar|überspring|ignorier).*(?:inbox|voice inbox|инбокс|voice|bandeja)/i.test(
      lower,
    ) ||
    /(?:dismiss first inbox|пропусти первый inbox|omitir primer inbox|ersten inbox überspringen)/i.test(
      lower,
    )
  ) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "dismiss_inbox",
      label: ru ? "Пропустить Inbox" : "Dismiss inbox item",
      summary: ru ? "Пропустить первый пункт Voice Inbox" : "Dismiss first Voice Inbox item",
      confidence: "medium",
      evidence: ["dismiss_inbox"],
      executable: false,
    };
  }

  if (isUndoLastActionPhrase(text) || isUndoBatchPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "undo_last_action",
      label: ru ? "Отменить действие" : "Undo last action",
      summary: ru ? "Отменить последние голосовые действия" : "Undo the last voice workspace action(s)",
      confidence: "high",
      evidence: ["undo_last_action"],
      executable: true,
    };
  }

  if (isRepeatLastCommandPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "repeat_last_command",
      label: ru ? "Повтор команды" : "Repeat last command",
      summary: ru ? "Выполнить последнюю команду снова" : "Run the last voice command again",
      confidence: "high",
      evidence: ["repeat_last_command"],
      executable: true,
    };
  }

  if (isCompleteFirstTaskPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "complete_task",
      label: ru ? "Завершить задачу" : "Complete task",
      summary: ru ? "Завершить первую открытую задачу" : "Complete the first open task",
      confidence: "medium",
      evidence: ["complete_first_task", "page_context"],
      executable: false,
    };
  }

  if (isSnoozeReminderPhrase(text)) {
    const title = extractSnoozeReminderTitle(text);
    const reminderTime = parseReminderDateTime(text) ?? undefined;
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    return {
      rawText: text,
      intent: "snooze_reminder",
      label: ru ? "Отложить напоминание" : es ? "Posponer recordatorio" : de ? "Erinnerung verschieben" : "Snooze reminder",
      summary: reminderTime
        ? title
          ? ru
            ? `«${title}» → ${formatReminderTime(reminderTime, uiLang)}`
            : es
              ? `«${title}» → ${formatReminderTime(reminderTime, uiLang)}`
              : de
                ? `«${title}» → ${formatReminderTime(reminderTime, uiLang)}`
                : `${title} → ${formatReminderTime(reminderTime, uiLang)}`
          : ru
            ? `Отложить → ${formatReminderTime(reminderTime, uiLang)}`
            : es
              ? `Posponer → ${formatReminderTime(reminderTime, uiLang)}`
              : de
                ? `Verschieben → ${formatReminderTime(reminderTime, uiLang)}`
                : `Snooze → ${formatReminderTime(reminderTime, uiLang)}`
        : ru
          ? "Отложить напоминание"
          : es
            ? "Posponer recordatorio"
            : de
              ? "Erinnerung verschieben"
              : "Snooze reminder",
      title: title || undefined,
      reminderTime,
      confidence: reminderTime ? "medium" : "low",
      evidence: ["snooze_reminder"],
      executable: false,
      pendingSlot: reminderTime ? undefined : "reminderTime",
      question: reminderTime
        ? undefined
        : ru
          ? "На сколько отложить?"
          : es
            ? "¿Por cuánto posponer?"
            : de
              ? "Wie lange verschieben?"
              : "Snooze for how long?",
    };
  }

  if (isRescheduleReminderPhrase(text)) {
    const title = extractRescheduleReminderTitle(text);
    const reminderTime = parseReminderDateTime(text) ?? undefined;
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "reschedule_reminder",
      label: ru ? "Перенести напоминание" : "Reschedule reminder",
      summary: reminderTime
        ? title
          ? ru
            ? `«${title}» → ${formatReminderTime(reminderTime, uiLang)}`
            : `${title} → ${formatReminderTime(reminderTime, uiLang)}`
          : ru
            ? `Ближайшее → ${formatReminderTime(reminderTime, uiLang)}`
            : `Next reminder → ${formatReminderTime(reminderTime, uiLang)}`
        : ru
          ? "Перенести напоминание"
          : "Reschedule reminder",
      title: title || undefined,
      reminderTime,
      confidence: reminderTime ? "medium" : "low",
      evidence: ["reschedule_reminder"],
      executable: false,
      pendingSlot: reminderTime ? undefined : "reminderTime",
      question: reminderTime ? undefined : ru ? "На когда перенести?" : "Reschedule to when?",
    };
  }

  if (isCancelReminderPhrase(text)) {
    const title = extractCancelReminderTitle(text);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "cancel_reminder",
      label: ru ? "Отменить напоминание" : "Cancel reminder",
      summary: title
        ? ru
          ? `Отменить «${title}»`
          : `Cancel reminder ${title}`
        : ru
          ? "Отменить ближайшее напоминание"
          : "Cancel next reminder",
      title: title || undefined,
      confidence: "high",
      evidence: ["cancel_reminder"],
      executable: true,
      destructive: true,
    };
  }

  if (isSearchFilesPhrase(text)) {
    const query = extractSearchFilesQuery(text);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "search_files",
      label: ru ? "Поиск файлов" : locale === "uk" ? "Пошук файлів" : "Search files",
      summary: query
        ? ru
          ? `Найти файл «${query}»`
          : locale === "uk"
            ? `Знайти файл «${query}»`
            : `Find file ${query}`
        : ru
          ? "Поиск в Vault"
          : "Search Vault",
      searchQuery: query || undefined,
      route: "/files",
      confidence: "medium",
      evidence: ["search_files"],
      executable: true,
    };
  }

  if (isShowProjectsRiskPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    return {
      rawText: text,
      intent: "show_projects_risk",
      label: ru ? "Рисковые проекты" : es ? "Proyectos de riesgo" : de ? "Risikoprojekte" : "Risk projects",
      summary: ru
        ? "Показать рисковые проекты"
        : es
          ? "Mostrar proyectos de riesgo"
          : de
            ? "Risikoprojekte anzeigen"
            : "Show high-risk projects",
      route: "/projects",
      confidence: "high",
      evidence: ["show_projects_risk"],
      executable: true,
    };
  }

  if (isShowProjectsGridPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    return {
      rawText: text,
      intent: "show_projects_grid",
      label: ru ? "Сетка проектов" : es ? "Cuadrícula de proyectos" : de ? "Projektraster" : "Projects grid",
      summary: ru
        ? "Показать проекты сеткой"
        : es
          ? "Mostrar proyectos en cuadrícula"
          : de
            ? "Projekte als Raster anzeigen"
            : "Show projects as grid",
      route: "/projects",
      confidence: "high",
      evidence: ["show_projects_grid"],
      executable: true,
    };
  }

  if (isShowProjectsTablePhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    return {
      rawText: text,
      intent: "show_projects_table",
      label: ru ? "Таблица проектов" : es ? "Tabla de proyectos" : de ? "Projekttabelle" : "Projects table",
      summary: ru
        ? "Показать проекты таблицей"
        : es
          ? "Mostrar proyectos en tabla"
          : de
            ? "Projekte als Tabelle anzeigen"
            : "Show projects as table",
      route: "/projects",
      confidence: "high",
      evidence: ["show_projects_table"],
      executable: true,
    };
  }

  if (isFilterTeamMapPhrase(text)) {
    const filter = extractTeamMapFilter(text);
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    const bits = [filter.status, filter.timezone].filter(Boolean).join(" · ");
    return {
      rawText: text,
      intent: "filter_team_map",
      label: ru ? "Фильтр карты" : es ? "Filtro del mapa" : de ? "Kartenfilter" : "Team map filter",
      summary: bits
        ? ru
          ? `Карта: ${bits}`
          : es
            ? `Mapa: ${bits}`
            : de
              ? `Karte: ${bits}`
              : `Team map: ${bits}`
        : ru
          ? "Показать карту команды"
          : es
            ? "Mostrar mapa del equipo"
            : de
              ? "Teamkarte anzeigen"
              : "Show team map",
      route: "/team-map",
      teamMapStatus: filter.status,
      teamMapTimezone: filter.timezone,
      confidence: filter.status || filter.timezone ? "high" : "medium",
      evidence: ["filter_team_map"],
      executable: true,
    };
  }

  if (isLearningSummaryPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    return {
      rawText: text,
      intent: "show_memories",
      label: ru ? "Статус обучения" : es ? "Resumen de aprendizaje" : de ? "Lernübersicht" : "Learning summary",
      summary: ru ? "Статус памяти и вопросов" : es ? "Estado de memoria y preguntas" : de ? "Gedächtnis- und Fragenstatus" : "Memory and questions status",
      route: "/intelligence",
      intelligenceTab: "memory",
      confidence: "high",
      evidence: ["learning_summary"],
      executable: true,
      speakOnly: true,
    };
  }

  if (isShowLearningQuestionsPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    return {
      rawText: text,
      intent: "show_learning_questions",
      label: ru ? "Вопросы Sense" : es ? "Preguntas de Sense" : de ? "Sense-Fragen" : "Sense questions",
      summary: ru ? "Открытые вопросы Intelligence" : es ? "Preguntas abiertas" : de ? "Offene Fragen" : "Open learning questions",
      route: "/intelligence",
      intelligenceTab: "questions",
      confidence: "high",
      evidence: ["show_learning_questions"],
      executable: true,
    };
  }

  if (isShowMemoriesPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    const es = locale === "es";
    const de = locale === "de";
    return {
      rawText: text,
      intent: "show_memories",
      label: ru ? "Память" : es ? "Memoria" : de ? "Gedächtnis" : "Memory",
      summary: ru ? "Показать память Sense" : es ? "Mostrar memoria de Sense" : de ? "Sense-Gedächtnis anzeigen" : "Show Sense memory",
      route: "/intelligence",
      intelligenceTab: "memory",
      confidence: "high",
      evidence: ["show_memories"],
      executable: true,
    };
  }

  if (isReminderCountQuestion(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_reminders",
      label: ru ? "Напоминания" : "Reminders",
      summary: ru ? "Сколько напоминаний" : "Reminder count",
      confidence: "high",
      evidence: ["show_reminders", "count"],
      executable: true,
      speakOnly: true,
      conversational: true,
    };
  }

  if (isShowRemindersPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "show_reminders",
      label: ru ? "Напоминания" : "Reminders",
      summary: ru ? "Показать напоминания" : "Show upcoming reminders",
      route: "/intelligence",
      confidence: "high",
      evidence: ["show_reminders"],
      executable: true,
    };
  }

  if (isFilterProjectsByStatusPhrase(text)) {
    const status = extractProjectStatusFilter(text);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "filter_projects",
      label: ru ? "Фильтр проектов" : "Filter projects",
      summary: status
        ? ru
          ? `Проекты: ${status}`
          : locale === "uk"
            ? `Проєкти: ${status}`
            : `Projects: ${status}`
        : ru
          ? "Фильтр списка проектов"
          : "Filter projects list",
      searchQuery: status ?? undefined,
      route: "/projects",
      confidence: status ? "high" : "medium",
      evidence: ["filter_projects"],
      executable: Boolean(status),
      question: status ? undefined : ru ? "Какой статус?" : "Which status?",
    };
  }

  if (isSearchProjectsPhrase(text)) {
    const query = extractSearchProjectsQuery(text);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "search_projects",
      label: ru ? "Поиск проектов" : locale === "uk" ? "Пошук проєктів" : "Search projects",
      summary: query
        ? ru
          ? `Найти проект «${query}»`
          : locale === "uk"
            ? `Знайти проєкт «${query}»`
            : `Find project ${query}`
        : ru
          ? "Открыть список проектов"
          : "Open projects list",
      searchQuery: query || undefined,
      route: "/projects",
      confidence: query ? "high" : "medium",
      evidence: ["search_projects"],
      executable: true,
    };
  }

  if (isOpenFirstProjectPhrase(text)) {
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "open_project",
      label: ru ? "Открыть проект" : locale === "es" ? "Abrir proyecto" : locale === "de" ? "Projekt öffnen" : "Open project",
      summary: ru ? "Открыть первый проект" : locale === "es" ? "Abrir el primer proyecto" : locale === "de" ? "Erstes Projekt öffnen" : "Open the first project",
      confidence: "medium",
      evidence: ["open_first_project", "page_context"],
      executable: false,
    };
  }

  if (isAssignToThisPersonPhrase(text)) {
    const taskTitle = extractAssignToThisPersonTask(text) || cleanupTitle(text.replace(/^(?:assign|назнач(?:ь|ить)|asignar|zuweis(?:en)?)\s+/i, ""));
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "assign_task",
      label: ru ? "Назначить задачу" : "Assign task",
      summary: taskTitle
        ? ru
          ? `Назначить «${taskTitle}» этому человеку`
          : `Assign ${taskTitle} to this person`
        : ru
          ? "Назначить задачу выбранному человеку"
          : "Assign task to focused person",
      title: taskTitle || undefined,
      confidence: taskTitle ? "medium" : "low",
      evidence: ["assign_task", "assign_to_focused_person", "page_context"],
      executable: false,
      question: taskTitle ? undefined : ru ? "Какую задачу назначить?" : "Which task should I assign?",
      pendingSlot: taskTitle ? undefined : "taskTitle",
    };
  }

  if (isCreateTaskOnBoardPhrase(text)) {
    const title = extractCreateTaskHereTitle(text);
    const ru = locale === "ru" || locale === "uk";
    return {
      rawText: text,
      intent: "create_task",
      label: b.labels.create_task,
      title: title || undefined,
      summary: title
        ? ru
          ? `Создать задачу «${title}» на доске`
          : `Create task "${title}" on board`
        : ru
          ? "Создать задачу на доске"
          : "Create task on board",
      confidence: title ? "high" : "low",
      evidence: ["create_task", "tasks_board"],
      question: title ? undefined : b.taskTitleQuestion,
      pendingSlot: title ? undefined : "title",
      executable: Boolean(title),
    };
  }

  if (isCreateTaskHerePhrase(text)) {
    const title = extractCreateTaskHereTitle(text);
    const ru = locale === "ru" || locale === "uk";
    const projectLabel = pageCtx?.title;
    return {
      rawText: text,
      intent: "create_task",
      label: b.labels.create_task,
      title: title || undefined,
      projectId: pageCtx?.ids?.projectId,
      summary: title
        ? ru
          ? `Создать задачу «${title}»${projectLabel ? ` в «${projectLabel}»` : " здесь"}`
          : `Create task "${title}"${projectLabel ? ` in ${projectLabel}` : " here"}`
        : ru
          ? `Создать задачу${projectLabel ? ` в «${projectLabel}»` : " здесь"}`
          : `Create task${projectLabel ? ` in ${projectLabel}` : " here"}`,
      confidence: title ? "high" : "low",
      evidence: ["create_task", "page_context"],
      question: title ? undefined : b.taskTitleQuestion,
      pendingSlot: title ? undefined : "title",
      executable: Boolean(title),
    };
  }

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
      pendingSlot: title ? undefined : "title",
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
      pendingSlot: title ? undefined : "title",
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
    const query = extractSearchQuery(text, [...en.search, ...b.search]);
    return {
      rawText: text,
      intent: "search",
      label: b.labels.search,
      summary: query
        ? locale === "ru" || locale === "uk"
          ? `Найти «${query}»`
          : `Search for "${query}"`
        : locale === "ru" || locale === "uk"
          ? "Открыть поиск"
          : "Open search",
      searchQuery: query || undefined,
      confidence: query ? "high" : "medium",
      evidence: [b.evidence.searchPhrase, b.evidence.searchShell],
      advice: [b.evidence.searchShell],
      executable: true,
    };
  }

  const openProjectMatch = lower.match(
    /(?:open|go to|show|открой|открыть|покажи|відкрий|abrir|mostrar|öffne|zeige)\s+(?:the\s+)?(?:project|проект|проєкт|proyecto|projekt)\s+(.+)/,
  );
  if (openProjectMatch?.[1]) {
    const name = cleanupTitle(openProjectMatch[1]);
    return {
      rawText: text,
      intent: "open_project",
      label: b.labels.open_route ?? "Project",
      summary: locale === "ru" || locale === "uk" ? `Открыть проект «${name}»` : `Open project ${name}`,
      title: name,
      confidence: "medium",
      evidence: [b.evidence.routeKeywords, "open_project"],
      executable: false,
      pendingSlot: undefined,
    };
  }

  const openTaskMatch = lower.match(
    /(?:open|show|go to|открой|покажи|відкрий|abrir|mostrar|öffne|zeige)\s+(?:the\s+)?(?:task|задач[уа]|задачу|tarea|aufgabe)\s+(.+)/,
  );
  if (openTaskMatch?.[1]) {
    const name = cleanupTitle(openTaskMatch[1]);
    return {
      rawText: text,
      intent: "open_task",
      label: b.labels.create_task,
      summary: locale === "ru" || locale === "uk" ? `Открыть задачу «${name}»` : `Open task ${name}`,
      title: name,
      confidence: "medium",
      evidence: ["open_task"],
      executable: false,
    };
  }

  const completeTaskMatch = lower.match(
    /(?:complete|finish|done|mark|close|заверш|выполн|отмет|закрий|закінч|completar|terminar|hecho|erledig|fertig|abschließ)\s+(?:the\s+)?(?:task|задач[уа]|задачу|tarea|aufgabe)\s+(.+)/,
  );
  if (completeTaskMatch?.[1]) {
    const name = cleanupTitle(completeTaskMatch[1]);
    return {
      rawText: text,
      intent: "complete_task",
      label: b.labels.create_task,
      summary: locale === "ru" || locale === "uk" ? `Завершить «${name}»` : `Complete task ${name}`,
      title: name,
      taskStatus: "done",
      confidence: "medium",
      evidence: ["complete_task"],
      executable: false,
    };
  }

  const deleteTaskMatch = lower.match(
    /(?:delete|remove|удали|удалить|видали|убери|eliminar|borrar|lösch|entfern)\s+(?:the\s+)?(?:task|задач[уа]|задачу|tarea|aufgabe)\s+(.+)/,
  );
  if (deleteTaskMatch?.[1]) {
    const name = cleanupTitle(deleteTaskMatch[1]);
    return {
      rawText: text,
      intent: "delete_task",
      label: locale === "ru" || locale === "uk" ? "Удалить задачу" : "Delete task",
      summary: locale === "ru" || locale === "uk" ? `Удалить «${name}»` : `Delete task ${name}`,
      title: name,
      confidence: "medium",
      evidence: ["delete_task"],
      executable: false,
      destructive: true,
    };
  }

  const statusUpdate = parseTaskStatusUpdate(lower, text, locale);
  if (statusUpdate) return statusUpdate;

  const assignMatch = lower.match(
    /(?:assign|назнач(?:ь|ить)|признач(?:и|ити)|asignar|assignar|zuweis|weis.*zu)\s+(?:task|задач[уа]|задачу|tarea|aufgabe)\s+(.+?)\s+(?:to|на|кому|a|an)\s+(.+)/,
  );
  if (assignMatch?.[1] && assignMatch?.[2]) {
    const name = cleanupTitle(assignMatch[1]);
    const assignee = cleanupTitle(assignMatch[2]);
    return {
      rawText: text,
      intent: "assign_task",
      label: locale === "ru" || locale === "uk" ? "Назначить задачу" : "Assign task",
      summary: locale === "ru" || locale === "uk" ? `«${name}» → ${assignee}` : `${name} → ${assignee}`,
      title: name,
      assigneeName: assignee,
      confidence: "medium",
      evidence: ["assign_task"],
      executable: false,
    };
  }

  const assignAlt = lower.match(
    /(?:assign|назнач(?:ь|ить)|признач(?:и|ити))\s+(.+?)\s+(?:to task|на задач[уа]|задач[уа])\s+(.+)/,
  );
  if (assignAlt?.[1] && assignAlt?.[2]) {
    const assignee = cleanupTitle(assignAlt[1]);
    const name = cleanupTitle(assignAlt[2]);
    return {
      rawText: text,
      intent: "assign_task",
      label: locale === "ru" || locale === "uk" ? "Назначить задачу" : "Assign task",
      summary: `${name} → ${assignee}`,
      title: name,
      assigneeName: assignee,
      confidence: "medium",
      evidence: ["assign_task"],
      executable: false,
    };
  }

  const rescheduleMatch = lower.match(
    /(?:reschedule|move|postpone|delay|перенес(?:и|ите)|перенести|срок|дедлайн|reprogramar|aplazar|verschieb|verleg)\s+(?:task|задач[уа]|задачу|tarea|aufgabe)\s+(.+)/,
  );
  if (rescheduleMatch?.[1]) {
    const rest = cleanupTitle(rescheduleMatch[1]);
    const dueDate = parseDueDateFromText(rest) ?? parseDueDateFromText(text);
    const title = dueDate ? cleanupTitle(rest.replace(/\b(to|on|на|к|до)\b.+$/i, "").trim()) || rest : rest;
    return {
      rawText: text,
      intent: "reschedule_task",
      label: locale === "ru" || locale === "uk" ? "Перенести дедлайн" : "Reschedule task",
      summary: dueDate
        ? locale === "ru" || locale === "uk"
          ? `«${title}» → ${formatDueDateLabel(dueDate, uiLang)}`
          : `${title} → ${formatDueDateLabel(dueDate, uiLang)}`
        : title,
      title,
      dueDate: dueDate ?? undefined,
      confidence: dueDate ? "medium" : "low",
      evidence: ["reschedule_task"],
      executable: false,
      pendingSlot: dueDate ? undefined : "dueDate",
      question: dueDate ? undefined : locale === "ru" || locale === "uk" ? "На какую дату?" : "Move to which date?",
    };
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
      executable: true,
      inboxKind: "note",
    };
  }

  if (includesAny(lower, reminderPhrases)) {
    if (utteranceHasReminderSchedule(text)) {
      const reminderTime = parseReminderDateTime(text) ?? undefined;
      const parsed = parseReminderUtterance(text);
      const title = parsed?.title || extractReminderTitle(text) || undefined;
      return {
        rawText: text,
        intent: "create_reminder",
        label: locale === "ru" || locale === "uk" ? "Напоминание" : "Reminder",
        summary:
          title && reminderTime
            ? locale === "ru" || locale === "uk"
              ? `«${title}» · ${formatReminderTime(reminderTime, uiLang)}`
              : `${title} · ${formatReminderTime(reminderTime, uiLang)}`
            : title ?? (locale === "ru" || locale === "uk" ? "Напоминание" : "Reminder"),
        title,
        reminderTime,
        confidence: title && reminderTime ? "high" : "medium",
        evidence: ["create_reminder", "scheduled"],
        executable: Boolean(title && reminderTime),
        pendingSlot: !title ? "title" : !reminderTime ? "reminderTime" : undefined,
        question: !title
          ? b.reminderTimeQuestion
          : !reminderTime
            ? locale === "ru" || locale === "uk"
              ? "Во сколько?"
              : "What time?"
            : undefined,
      };
    }

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
      executable: true,
      inboxKind: "reminder",
    };
  }

  const processInboxExplicit =
    /(?:create|make|создай|створи|crear|erstell)\s+(?:a\s+)?task\s+from\s+(?:the\s+)?(?:first\s+)?(?:inbox|voice)/.test(
      lower,
    ) ||
    /(?:create|make|создай|crear|erstell)\s+(?:a\s+)?project\s+from\s+(?:the\s+)?(?:first\s+)?(?:inbox|voice)/.test(
      lower,
    );
  const processInboxMatch = lower.match(
    /(?:process|handle|convert|review|обработай|обработать|разбери|переведи|перетвори|procesar|verarbeiten|bearbeiten)\s+(?:(?:the|first|next|первый|перший|1-й|primer|ersten)\s+)?(?:inbox|voice inbox|voice|пункт|запись|элемент|inbox item|bandeja)/,
  );
  if (processInboxMatch || processInboxExplicit || /\b(?:inbox|инбокс)\s+(?:process|обработ)/.test(lower)) {
    const asProject = /project|проект|проєкт/.test(lower);
    const asTask = /task|задач|задачу|tarea|aufgabe/.test(lower) || processInboxExplicit;
    return {
      rawText: text,
      intent: "process_inbox",
      label: locale === "ru" || locale === "uk" ? "Voice Inbox" : "Voice Inbox",
      summary:
        locale === "ru" || locale === "uk"
          ? "Обработать первый пункт Voice Inbox"
          : "Process first Voice Inbox item",
      inboxAction: asProject ? "project" : asTask ? "task" : "auto",
      confidence: "medium",
      evidence: ["process_inbox"],
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
  intent: VoicePlan["intent"],
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

function voicePlanNeedsNetwork(intent: VoiceIntent) {
  return ![
    "open_route",
    "show_today",
    "show_risks",
    "search",
    "search_projects",
    "filter_projects",
    "show_reminders",
    "show_projects_risk",
    "show_projects_table",
    "show_projects_grid",
    "search_files",
    "open_team_person",
    "filter_team_map",
    "snooze_reminder",
    "open_project",
    "open_task",
    "draft_note",
    "draft_reminder",
    "repeat_last_command",
    "unknown",
  ].includes(intent);
}

async function readTaskSnapshot(taskId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("status,assignee_id,due_date,title")
    .eq("id", taskId)
    .single();
  if (error || !data) throw error ?? new Error("Task not found");
  return data;
}
