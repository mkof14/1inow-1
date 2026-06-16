import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Maximize2, Minimize2, Mic, Send, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiPageContext } from "@/lib/ai-context";

type Mode = "docked" | "floating" | "collapsed";

const SUGGESTIONS = [
  "What needs my attention today?",
  "Summarize this week",
  "Who is waiting on me?",
  "What's blocked right now?",
];

function makeTransport(getCtx: () => unknown) {
  return new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (url, init) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      // Inject page context into body
      let body = init?.body;
      try {
        if (typeof body === "string") {
          const parsed = JSON.parse(body);
          parsed.pageContext = getCtx();
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
  const [input, setInput] = useState("");
  const { context } = useAiPageContext();
  const ctxRef = useRef(context);
  ctxRef.current = context;
  const [transport] = useState(() => makeTransport(() => ctxRef.current));
  const { messages, sendMessage, status } = useChat({ transport });
  const scrollRef = useRef<HTMLDivElement>(null);

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
    ? "fixed right-4 bottom-4 top-20 w-[420px] z-40 rounded-2xl border border-border shadow-2xl bg-card flex flex-col overflow-hidden"
    : "hidden lg:flex w-[380px] shrink-0 sticky top-0 h-screen border-l border-border bg-card flex-col";

  return (
    <aside className={containerCls}>
      <header className="h-12 px-3 flex items-center justify-between border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg gradient-compass grid place-items-center text-primary-foreground">
            <Sparkles className="size-3.5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">Compass AI</div>
            <div className="text-[10px] text-muted-foreground">Always with you</div>
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
              <div className="font-medium mb-1">Hi — I'm Compass.</div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                Ask anything. I see your projects, tasks, people and messages. Try one of these:
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
            <Loader2 className="size-3 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(input); }}
        className="border-t border-border p-3 space-y-2"
      >
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
            }}
            placeholder="Ask Compass…"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="size-7" title="Voice (coming soon)">
              <Mic className="size-3.5" />
            </Button>
            <Button type="submit" size="icon" className="size-7" disabled={loading || !input.trim()}>
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Enter to send · Shift+Enter for new line</span>
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
  return (
    <button
      onClick={onClick}
      className="hidden lg:flex fixed right-4 bottom-24 z-30 size-12 rounded-full gradient-compass text-primary-foreground shadow-xl items-center justify-center hover:scale-105 transition"
      title="Open Compass AI (⌘J)"
    >
      <Sparkles className="size-5" />
    </button>
  );
}

export { type Mode as AiSidebarMode };

export function CollapsedRail({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="hidden lg:flex sticky top-0 h-screen w-10 shrink-0 border-l border-border bg-card items-start justify-center pt-4 hover:bg-muted/40 transition"
      title="Open Compass AI"
    >
      <div className="flex flex-col items-center gap-3">
        <Sparkles className="size-4 text-accent" />
        <ChevronLeft className="size-3 text-muted-foreground" />
      </div>
    </button>
  );
}

export function FloatingHandle({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="fixed right-3 top-1/2 -translate-y-1/2 z-30 px-1.5 py-3 rounded-l-lg bg-card border border-r-0 border-border text-muted-foreground hover:text-accent"
      title="Open Compass AI"
    >
      <ChevronRight className="size-3 rotate-180" />
    </button>
  );
}