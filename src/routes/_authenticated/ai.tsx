import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { askAdvisor } from "@/lib/advisor.functions";
import { PageHeader } from "@/components/page-header";
import { Send, Loader2, TrendingUp, AlertTriangle, CalendarRange, Lightbulb } from "lucide-react";
import { useT, useI18n } from "@/lib/i18n";
import { SENSE_ASSETS } from "@/lib/sense-assets";

export const Route = createFileRoute("/_authenticated/ai")({ component: AdvisorPage });

type Msg = { role: "user" | "assistant"; text: string };

function AdvisorPage() {
  const t = useT();
  const { lang } = useI18n();
  const ask = useServerFn(askAdvisor);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const m = useMutation({
    mutationFn: async (prompt: string) => ask({ data: { prompt, lang } }),
    onSuccess: (r: any) => setMsgs((x) => [...x, { role: "assistant", text: r.text }]),
    onError: (e: any) =>
      setMsgs((x) => [...x, { role: "assistant", text: `⚠️ ${e?.message ?? "Error"}` }]),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, m.isPending]);

  const send = (prompt: string) => {
    if (!prompt.trim() || m.isPending) return;
    setMsgs((x) => [...x, { role: "user", text: prompt }]);
    setInput("");
    m.mutate(prompt);
  };

  const presets = [
    { icon: TrendingUp, label: t("advisor.preset.summary"), prompt: t("advisor.preset.summary.q") },
    {
      icon: AlertTriangle,
      label: t("advisor.preset.blockers"),
      prompt: t("advisor.preset.blockers.q"),
    },
    { icon: CalendarRange, label: t("advisor.preset.week"), prompt: t("advisor.preset.week.q") },
    {
      icon: Lightbulb,
      label: t("advisor.preset.decisions"),
      prompt: t("advisor.preset.decisions.q"),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto fade-rise">
      <PageHeader
        icon={<img src={SENSE_ASSETS.sense} alt="" className="size-11 rounded-2xl" />}
        title={t("page.advisor.title")}
        subtitle={t("page.advisor.desc")}
      />

      {msgs.length === 0 && (
        <div className="surface-aurora shimmer-border rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
            <Lightbulb className="size-3.5" /> {t("advisor.eyebrow")}
          </div>
          <h2 className="text-lg font-display font-semibold mb-4">{t("advisor.greet")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => send(p.prompt)}
                className="group text-left rounded-xl border border-border bg-card/60 hover:bg-card hover:border-accent/50 p-3.5 transition flex items-start gap-3"
              >
                <p.icon className="size-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {p.prompt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-4">
        {msgs.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                msg.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-accent text-accent-foreground px-4 py-2.5 text-sm"
                  : "max-w-[90%] surface-aurora shimmer-border rounded-2xl rounded-bl-md px-4 py-3.5 text-sm whitespace-pre-wrap leading-relaxed"
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
        {m.isPending && (
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> {t("advisor.thinking")}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-4 flex items-center gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur p-2 shadow-lg"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("advisor.placeholder")}
          className="flex-1 bg-transparent outline-none px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={m.isPending || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-3.5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40"
        >
          <Send className="size-3.5" /> {t("advisor.send")}
        </button>
      </form>
    </div>
  );
}
