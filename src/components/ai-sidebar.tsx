import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { isFounderModeEnabled } from "@/lib/founder-mode";
import { Button } from "@/components/ui/button";
import {
  X,
  Maximize2,
  Minimize2,
  Mic,
  Send,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiPageContext } from "@/lib/ai-context";
import { useI18n } from "@/lib/i18n";
import { BrandMark } from "@/components/icons/compass-mark";
import { SENSE_ASSETS, SENSE_NAME } from "@/lib/sense-assets";
import { VoiceUnifiedConsole, type VoiceConsoleMode } from "@/components/voice/voice-unified-console";
import {
  VoiceCommandCenter,
  type VoiceCommandsBridge,
} from "@/components/voice-command-center";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { resolveResponseLang } from "@/lib/voice-locale";

type Mode = "docked" | "floating" | "collapsed";

function makeTransport(getCtx: () => unknown, getLang: () => string) {
  return new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (url, init) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      else if (isFounderModeEnabled()) headers.set("X-1inow-Founder-Voice", "1");
      headers.set("x-user-language", getLang());
      // Inject page context into body
      let body = init?.body;
      try {
        if (typeof body === "string") {
          const parsed = JSON.parse(body);
          parsed.pageContext = getCtx();
          parsed.lang = getLang();
          body = JSON.stringify(parsed);
          headers.set("content-type", "application/json");
        }
      } catch {
        // Keep the original body when page context injection fails.
      }
      return fetch(url as string, { ...init, headers, body });
    },
  });
}

export function AiSidebar({
  open,
  mode,
  onModeChange,
  onClose,
  initialVoiceTab = "chat",
}: {
  open: boolean;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onClose: () => void;
  initialVoiceTab?: VoiceConsoleMode;
}) {
  const { t, lang, setLang } = useI18n();
  const activeLangRef = useRef(lang);
  activeLangRef.current = lang;
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState<VoiceConsoleMode>(initialVoiceTab);
  const commandsBridgeRef = useRef<VoiceCommandsBridge | null>(null);
  const { context } = useAiPageContext();
  const ctxRef = useRef(context);
  ctxRef.current = context;
  const [transport] = useState(() =>
    makeTransport(
      () => ctxRef.current,
      () => activeLangRef.current,
    ),
  );

  // Restore chat history (kept for 7 days in this browser).
  const HISTORY_KEY = "1inow:ai:history:v1";
  const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const initialMessages: UIMessage[] = (() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { savedAt?: number; messages?: UIMessage[] };
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > HISTORY_TTL_MS) {
        window.localStorage.removeItem(HISTORY_KEY);
        return [];
      }
      return Array.isArray(parsed.messages) ? parsed.messages : [];
    } catch {
      return [];
    }
  })();

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    messages: initialMessages,
  });

  // Persist on change, debounced to next tick.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status === "streaming" || status === "submitted") return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ savedAt: Date.now(), messages }));
    } catch {}
  }, [messages, status]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const submitRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    if (open) setVoiceMode(initialVoiceTab);
  }, [open, initialVoiceTab]);

  const voice = useVoiceSession({
    lang,
    continuous: true,
    conversationMode: true,
    autoSend: true,
    onTranscript: (text, final) => {
      if (voiceMode === "commands" && commandsBridgeRef.current) {
        commandsBridgeRef.current.onTranscript(text, final);
        return;
      }
      setInput(text);
      if (final && text.trim()) {
        const responseLang = resolveResponseLang(lang, text);
        if (responseLang !== lang) setLang(responseLang);
        activeLangRef.current = responseLang;
      }
    },
    onLangDetected: (detected) => {
      if (detected !== lang) setLang(detected);
      activeLangRef.current = detected;
    },
    onAutoSend: (utterance, utteranceLang) => {
      if (utteranceLang !== lang) setLang(utteranceLang);
      activeLangRef.current = utteranceLang;
      if (voiceMode === "commands" && commandsBridgeRef.current) {
        commandsBridgeRef.current.onAutoSend(utterance);
        return;
      }
      submitRef.current(utterance);
    },
    onVoiceControl: (action) => {
      if (action === "stop") setInput("");
    },
  });

  const stopSpeaking = voice.stopSpeaking;
  const clearHistory = useCallback(() => {
    try {
      window.localStorage.removeItem(HISTORY_KEY);
    } catch {}
    setMessages([]);
    spokenIdsRef.current = new Set();
    stopSpeaking();
  }, [setMessages, stopSpeaking]);

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
    tabChat: t("voice.tab.chat", "Chat · Vera"),
    tabCommands: t("voice.tab.commands", "Commands · Nova"),
    novaRole: t("voice.nova.role"),
    veraRole: t("voice.vera.role"),
    micIn: t("voice.meter.mic"),
    speakerOut: t("voice.meter.out"),
    novaSpeaking: t("voice.status.novaSpeaking"),
    veraSpeaking: t("voice.status.veraSpeaking"),
    novaListening: t("voice.status.novaListening"),
    veraListening: t("voice.status.veraListening"),
  };

  const handleVoiceStop = useCallback(() => {
    voice.stopSpeaking();
    if (status === "streaming" || status === "submitted") {
      // useChat may not expose stop — at minimum halt TTS
    }
  }, [voice.stopSpeaking, status]);

  // Speak new assistant replies — single natural voice.
  useEffect(() => {
    if (!voice.speakerOn) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (status === "streaming" || status === "submitted") return;
    if (spokenIdsRef.current.has(last.id)) return;
    const text = last.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();
    const spoken = text;
    if (!spoken) return;
    spokenIdsRef.current.add(last.id);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUser?.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();
    const speakLang = userText ? resolveResponseLang(lang, userText) : lang;
    void voice.speakText(spoken, speakLang);
  }, [messages, status, voice.speakerOn, voice.speakText, lang]);

  const SUGGESTIONS = [
    t("ai.chip.attention"),
    t("ai.chip.week"),
    t("ai.chip.waiting"),
    t("ai.chip.blocked"),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = useCallback(
    (text: string) => {
      const v = text.trim();
      if (!v || status === "streaming" || status === "submitted") return;
      const responseLang = resolveResponseLang(lang, v);
      if (responseLang !== lang) setLang(responseLang);
      activeLangRef.current = responseLang;
      sendMessage({ text: v });
      setInput("");
    },
    [sendMessage, status, lang, setLang],
  );
  submitRef.current = submit;

  if (!open) return null;
  const loading = status === "streaming" || status === "submitted";

  const containerCls =
    mode === "floating"
      ? "fixed inset-x-2 bottom-20 top-16 sm:inset-x-auto sm:right-4 sm:bottom-20 sm:top-20 sm:w-[420px] max-w-[calc(100vw-1rem)] z-40 rounded-2xl border border-border shadow-2xl bg-card flex flex-col overflow-hidden"
      : "hidden lg:flex w-[380px] shrink-0 sticky top-0 h-screen border-l border-border bg-card flex-col";

  return (
    <aside className={containerCls}>
      <header className="h-12 px-3 flex items-center justify-between border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-2">
          <img src={SENSE_ASSETS.sense} alt="" className="size-8 rounded-lg shadow-sm" />
          <div className="leading-tight">
            <div className="text-sm font-medium">{SENSE_NAME}</div>
            <div className="text-[10px] text-muted-foreground">{t("voice.subtitle")}</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-[10px] font-medium px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title={t("ai.clear", "Clear conversation")}
            >
              {t("ai.clear", "Clear")}
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onModeChange(mode === "floating" ? "docked" : "floating")}
          >
            {mode === "floating" ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {voiceMode === "commands" ? (
          <VoiceCommandCenter embedded sharedVoice={voice} bridgeRef={commandsBridgeRef} />
        ) : (
          <>
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/40 border border-border p-3 text-sm">
              <div className="font-medium mb-1">{t("ai.welcome")}</div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                {t("ai.welcomeHint")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SensePersonaMini
                image={SENSE_ASSETS.nova}
                name="Nova"
                role={t("voice.nova.role", "Action · next step")}
                text={t("voice.nova.hint", "Commands, tasks, navigation.")}
              />
              <SensePersonaMini
                image={SENSE_ASSETS.vera}
                name="Vera"
                role={t("voice.vera.role", "Review · risk · meaning")}
                text={t("voice.vera.hint", "Questions, analysis, context.")}
              />
            </div>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="w-full text-left text-[13px] px-3 py-2 rounded-lg border border-border bg-background hover:border-accent/40 hover:bg-accent/5 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m: UIMessage, idx) => (
          <Bubble
            key={m.id}
            message={m}
            streaming={
              idx === messages.length - 1 && (status === "streaming" || status === "submitted")
            }
          />
        ))}
        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Loader2 className="size-3 animate-spin" /> {t("common.thinking")}
          </div>
        )}
          </>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (voiceMode === "chat") submit(input);
        }}
        className="border-t border-border p-3 space-y-2"
      >
        <VoiceUnifiedConsole
          phase={voice.phase}
          thinking={status === "streaming" || status === "submitted"}
          statusOverride={
            voice.handsFreeActive
              ? t("voice.status.handsFree")
              : undefined
          }
          lang={lang}
          micStream={voice.micStream}
          speakerOn={voice.speakerOn}
          speakingAudio={voice.speakingAudio}
          error={voice.error}
          handsFreeActive={voice.handsFreeActive}
          conversationMode={voice.conversationMode}
          activePersona={voice.activePersona}
          mode={voiceMode}
          onModeChange={setVoiceMode}
          onToggleMic={voice.toggleMic}
          onToggleSpeaker={voice.toggleSpeaker}
          onStop={handleVoiceStop}
          labels={voiceLabels}
        />
        {voiceMode === "chat" && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                handleVoiceStop();
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={t("ai.placeholder")}
            rows={2}
            className="min-w-0 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="flex shrink-0 items-center gap-1 pb-1">
            <Button
              type="submit"
              size="icon"
              className="size-9 rounded-full"
              disabled={loading || !input.trim()}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{t("ai.hint")}</span>
          <kbd className="font-mono px-1.5 py-0.5 rounded bg-muted">⌘J</kbd>
        </div>
      </form>
    </aside>
  );
}

function SensePersonaMini({
  image,
  name,
  role,
  text,
}: {
  image: string;
  name: string;
  role: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-2.5">
      <div className="flex items-center gap-2">
        <img src={image} alt="" className="size-8 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <div className="text-xs font-semibold">{name}</div>
          <div className="truncate text-[10px] text-muted-foreground">{role}</div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{text}</p>
    </div>
  );
}

function Bubble({ message, streaming }: { message: UIMessage; streaming?: boolean }) {
  const isUser = message.role === "user";
  const full = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  // Typewriter effect for assistant messages.
  const [shown, setShown] = useState(isUser ? full.length : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isUser) {
      setShown(full.length);
      return;
    }
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setShown((s) => {
        if (s >= full.length) return s;
        const speed = streaming ? 4 : 8;
        return Math.min(full.length, s + speed);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [full, streaming, isUser]);

  const display = isUser ? full : full.slice(0, shown);
  const showCaret = !isUser && (streaming || shown < full.length);

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 text-foreground border border-border",
        )}
      >
        {display}
        {showCaret && (
          <span className="inline-block w-[2px] h-[1em] align-[-2px] ml-0.5 bg-foreground/70 animate-pulse" />
        )}
      </div>
    </div>
  );
}

export function AiSidebarToggle({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      className="hidden lg:flex fixed right-5 bottom-28 z-30 size-12 rounded-full gradient-compass text-primary-foreground shadow-xl items-center justify-center hover:scale-105 transition"
      title={t("ai.openTip")}
    >
      <BrandMark className="size-5" />
    </button>
  );
}

export { type Mode as AiSidebarMode };

export function CollapsedRail({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onOpen}
      className="hidden lg:flex sticky top-0 h-screen w-10 shrink-0 border-l border-border bg-card items-start justify-center pt-4 hover:bg-muted/40 transition"
      title={t("ai.openTip")}
    >
      <div className="flex flex-col items-center gap-3">
        <BrandMark className="size-4 text-accent" />
        <ChevronLeft className="size-3 text-muted-foreground" />
      </div>
    </button>
  );
}

export function FloatingHandle({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onOpen}
      className="fixed right-3 top-1/2 -translate-y-1/2 z-30 px-1.5 py-3 rounded-l-lg bg-card border border-r-0 border-border text-muted-foreground hover:text-accent"
      title={t("ai.openTip")}
    >
      <ChevronRight className="size-3 rotate-180" />
    </button>
  );
}
