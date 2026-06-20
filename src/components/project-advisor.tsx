import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askProjectAdvisor } from "@/lib/project-advisor.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, AlertTriangle, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { useT, useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function ProjectAdvisor({ projectId, projectName }: { projectId: string; projectName: string }) {
  const t = useT();
  const { lang } = useI18n();
  const ask = useServerFn(askProjectAdvisor);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run(p: string) {
    if (!p.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const r = await ask({ data: { projectId, prompt: p, lang } });
      setAnswer(r.text);
    } catch (e: any) {
      toast.error(e?.message ?? "Advisor unavailable");
    } finally {
      setLoading(false);
    }
  }

  const presets = [
    { icon: AlertTriangle, label: t("padv.preset.risks"), q: t("padv.preset.risks.q") },
    { icon: Calendar,      label: t("padv.preset.week"),  q: t("padv.preset.week.q") },
    { icon: TrendingUp,    label: t("padv.preset.progress"), q: t("padv.preset.progress.q") },
  ];

  return (
    <div className="surface-aurora shimmer-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-accent/15 text-accent grid place-items-center">
          <Sparkles className="size-3.5" />
        </div>
        <div className="text-sm font-semibold font-display">{t("padv.title")}</div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{t("padv.subtitle").replace("{name}", projectName)}</p>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => { setPrompt(p.q); run(p.q); }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border border-border bg-card/60 hover:bg-card hover:border-accent/40 transition-colors disabled:opacity-50"
          >
            <p.icon className="size-3" />{p.label}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(prompt); }} className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("padv.placeholder")}
          disabled={loading}
          className="flex-1 h-9 px-3 rounded-lg bg-card/60 border border-border text-xs focus:outline-none focus:border-accent/60"
        />
        <Button type="submit" size="sm" disabled={loading || !prompt.trim()} className="h-9 px-3">
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        </Button>
      </form>

      {(loading || answer) && (
        <div className="rounded-lg bg-card/60 border border-border p-3 text-xs leading-relaxed whitespace-pre-wrap min-h-[60px]">
          {loading ? <span className="text-muted-foreground">{t("padv.thinking")}</span> : answer}
        </div>
      )}
    </div>
  );
}