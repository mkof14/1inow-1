import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, Mic, Send, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { BrandMark } from "@/components/icons/compass-mark";
import { cn } from "@/lib/utils";
import { useAiPageContext } from "@/lib/ai-context";
import { useI18n } from "@/lib/i18n";

type Mode = "docked" | "floating" | "collapsed";

function makeTransport(getCtx: () => unknown, getLang: () => string) {
  return new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (url, init) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
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
      } catch {}
      return fetch(url as string, { ...init, headers, body });
    },
  });
}

export function AiSidebar({ open, mode, onModeChange, onClose }: {
  open: boolean;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const langRef = useRef(lang);
  langRef.current = lang;
  const [input, setInput] = useState("");
  const { context } = useAiPageContext();
  const ctxRef = useRef(context);
  ctxRef.current = context;
  const [transport] = useState(() => makeTransport(() => ctxRef.current, () => langRef.current));
  const { messages, sendMessage, status } = useChat({ transport });
  const scrollRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    t("ai.chip.attention"),
    t("ai.chip.week"),
    t("ai.chip.waiting"),
    t("ai.chip.blocked"),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = useCallback((text: string) => {
    const v = text.trim();
    if (!v || status === "streaming" || status === "submitted") return;
    sendMessage({ text: v });
    setInput("");
  }, [sendMessage, status]);

  if (!open) return null;
  const loading = status === "streaming" || status === "submitted";

  const containerCls = mode === "floating"
    ? "fixed right-4 bottom-20 top-20 w-[420px] z-40 rounded-2xl border border-border shadow-2xl bg-card flex flex-col overflow-hidden"
    : "hidden lg:flex w-[380px] shrink-0 sticky top-0 h-screen border-l border-border bg-card flex-col";

  return (
    <aside className={containerCls}>
      <header className="h-12 px-3 flex items-center justify-between border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg gradient-compass grid place-items-center text-primary-foreground">
            <BrandMark className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">{t("ai.title")}</div>
            <div className="text-[10px] text-muted-foreground">{t("ai.subtitle")}</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onModeChange(mode === "floating" ? "docked" : "floating")}>
            {mode === "floating" ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/40 border border-border p-3 text-sm">
              <div className="font-medium mb-1">{t("ai.welcome")}</div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                {t("ai.welcomeHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => submit(s)}
                  className="w-full text-left text-[13px] px-3 py-2 rounded-lg border border-border bg-background hover:border-accent/40 hover:bg-accent/5 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m: UIMessage) => (
          <Bubble key={m.id} message={m} />
        ))}
        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Loader2 className="size-3 animate-spin" /> {t("common.thinking")}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(input); }}
        className="border-t border-border p-3 space-y-2"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
            }}
            placeholder={t("ai.placeholder")}
            rows={2}
            className="min-w-0 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="flex shrink-0 items-center gap-1 pb-1">
            <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" title={t("ai.voice")}>
              <Mic className="size-3.5" />
            </Button>
            <Button type="submit" size="icon" className="size-9 rounded-full" disabled={loading || !input.trim()}>
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{t("ai.hint")}</span>
          <kbd className="font-mono px-1.5 py-0.5 rounded bg-muted">⌘J</kbd>
        </div>
      </form>
    </aside>
  );
}

function Bubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground border border-border"
      )}>
        {text}
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