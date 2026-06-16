import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProjects, fetchTasks, fetchProfiles, fetchDecisions } from "@/lib/queries";
import {
  PageContainer, SectionHeader, ResponsiveGrid, SafeCard,
  CardTitle, Body, Small, Label, EmptyState,
} from "@/components/layout";
import { ThinkingLoop } from "@/components/icons/thinking-loop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { think, recordThinking, getThinkingLog, type ThinkingResult } from "@/lib/thinking";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/thinking")({
  component: ThinkingPage,
});

const CONF_CHIP: Record<ThinkingResult["confidence"]["level"], string> = {
  high:   "border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  medium: "border-amber-500/30 text-amber-700 dark:text-amber-400",
  low:    "border-rose-500/30 text-rose-700 dark:text-rose-400",
};

function ThinkingPage() {
  const t = useT();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ThinkingResult | null>(null);

  const projects  = useQuery({ queryKey: ["projects"],  queryFn: fetchProjects });
  const tasks     = useQuery({ queryKey: ["tasks"],     queryFn: () => fetchTasks() });
  const people    = useQuery({ queryKey: ["profiles"],  queryFn: fetchProfiles });
  const decisions = useQuery({ queryKey: ["decisions"], queryFn: fetchDecisions });
  const memories  = useQuery({
    queryKey: ["ai_memories", "active"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("ai_memories")
        .select("key,value,type,confidence").eq("status", "active").limit(100);
      return data ?? [];
    },
  });
  const rules = useQuery({
    queryKey: ["ai_rules", "active"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("ai_rules")
        .select("rule,scope").eq("active", true).limit(50);
      return data ?? [];
    },
  });

  const data = useMemo(() => ({
    projects:  projects.data ?? [],
    tasks:     tasks.data ?? [],
    people:    people.data ?? [],
    decisions: decisions.data ?? [],
    memories:  memories.data ?? [],
    rules:     rules.data ?? [],
  }), [projects.data, tasks.data, people.data, decisions.data, memories.data, rules.data]);

  const run = () => {
    if (!prompt.trim()) return;
    const r = think({ prompt, data });
    setResult(r);
    recordThinking(prompt, r);
  };

  const log = getThinkingLog();

  return (
    <PageContainer>
      <SectionHeader
        title={<span className="inline-flex items-center gap-2"><ThinkingLoop size={22} /> {t("thinking.title", "Thinking Engine")}</span>}
        description={t("thinking.subtitle", "Every request passes through 12 stages: understand, gather context, check rules, estimate confidence, plan — before any action is taken.")}
      />

      <SafeCard className="mb-6">
        <Label>{t("thinking.testRequest", "Test a request")}</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("thinking.placeholder", 'e.g. "Prepare investor meeting for Project Atlas next Tuesday"')}
          className="mt-2 min-h-[88px]"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Small>{t("thinking.note", "The engine never calls AI directly. It produces a plan first.")}</Small>
          <Button onClick={run} disabled={!prompt.trim()}>{t("thinking.run", "Run pipeline")}</Button>
        </div>
      </SafeCard>

      {result ? <ResultView result={result} /> : (
        <EmptyState
          icon={ThinkingLoop}
          title={t("thinking.empty.title", "No request analyzed yet")}
          description={t("thinking.empty.desc", "Type something above and run the pipeline to see how the engine would respond.")}
        />
      )}

      {log.length > 1 && (
        <div className="mt-8">
          <Label>{t("thinking.recentLog", "Recent thinking log")}</Label>
          <div className="mt-2 space-y-2">
            {log.slice(0, 8).map((e, i) => (
              <SafeCard key={i} className="!p-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="!truncate">{e.prompt}</CardTitle>
                  <Badge variant="outline" className={CONF_CHIP[e.result.confidence.level]}>
                    {e.result.confidence.level} · {e.result.confidence.score}
                  </Badge>
                </div>
                <Small className="mt-1">{e.result.log.reason}</Small>
              </SafeCard>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function ResultView({ result }: { result: ThinkingResult }) {
  const r = result;
  return (
    <ResponsiveGrid min={280}>
      <SafeCard>
        <Label>1. Understanding</Label>
        <CardTitle className="mt-1 !whitespace-normal">{r.understanding.subject}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="secondary">intent: {r.understanding.intent}</Badge>
          {r.understanding.verbs.slice(0, 4).map((v) => <Badge key={v} variant="outline">{v}</Badge>)}
        </div>
      </SafeCard>

      <SafeCard>
        <Label>2. Page context</Label>
        <Body className="mt-1">{r.context.page}</Body>
        <div className="mt-2 flex flex-wrap gap-1">
          {r.context.signals.length
            ? r.context.signals.map((s) => <Badge key={s} variant="outline">{s}</Badge>)
            : <Small>No page signals.</Small>}
        </div>
      </SafeCard>

      <SafeCard>
        <Label>3. Memory ({r.memory.length})</Label>
        {r.memory.length ? (
          <ul className="mt-2 space-y-1">
            {r.memory.slice(0, 5).map((m, i) => (
              <li key={i}><Small><b>{m.key}:</b> {m.value}</Small></li>
            ))}
          </ul>
        ) : <Small className="mt-1 block">No memory matched.</Small>}
      </SafeCard>

      <SafeCard>
        <Label>4. Related ({r.related.length})</Label>
        <div className="mt-2 flex flex-wrap gap-1">
          {r.related.length
            ? r.related.map((x, i) => <Badge key={i} variant="outline">{x.kind}: {x.label}</Badge>)
            : <Small>No related objects.</Small>}
        </div>
      </SafeCard>

      <SafeCard>
        <Label>5. Rules ({r.rules.length})</Label>
        {r.rules.length ? (
          <ul className="mt-2 space-y-1">{r.rules.map((rl, i) => <li key={i}><Small>• {rl}</Small></li>)}</ul>
        ) : <Small className="mt-1 block">No applicable rules.</Small>}
      </SafeCard>

      <SafeCard>
        <Label>6. Missing information</Label>
        {r.missing.length ? (
          <ul className="mt-2 space-y-1">
            {r.missing.map((m) => <li key={m}><Small className="text-amber-600 dark:text-amber-400">— {m}</Small></li>)}
          </ul>
        ) : <Small className="mt-1 block">Nothing missing.</Small>}
      </SafeCard>

      <SafeCard>
        <Label>7. Confidence</Label>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className={CONF_CHIP[r.confidence.level]}>
            {r.confidence.level} · {r.confidence.score}
          </Badge>
        </div>
        <ul className="mt-2 space-y-1">
          {r.confidence.reasons.map((x, i) => <li key={i}><Small>· {x}</Small></li>)}
        </ul>
      </SafeCard>

      <SafeCard>
        <Label>8. Temporary agents</Label>
        <div className="mt-2 flex flex-wrap gap-1">
          {r.agents.map((a) => <Badge key={a} variant="secondary">{a}</Badge>)}
        </div>
        <Small className="mt-2 block">Spawned per request, discarded after completion.</Small>
      </SafeCard>

      <SafeCard>
        <Label>9. Execution plan</Label>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {r.plan.map((p, i) => <li key={i}><Small>{p}</Small></li>)}
        </ol>
      </SafeCard>

      <SafeCard>
        <Label>10. Decision</Label>
        <div className="mt-2">
          {r.allowExecute ? (
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Approved to execute</Badge>
          ) : (
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">Needs review</Badge>
          )}
        </div>
        <Small className="mt-2 block">{r.log.reason}</Small>
      </SafeCard>

      <SafeCard>
        <Label>11. Self-check</Label>
        {r.selfCheck.conflicts.length === 0 && r.selfCheck.notes.length === 0
          ? <Small className="mt-1 block">No conflicts detected.</Small>
          : (
            <ul className="mt-2 space-y-1">
              {r.selfCheck.conflicts.map((c, i) => <li key={`c${i}`}><Small className="text-rose-600 dark:text-rose-400">⚠ {c}</Small></li>)}
              {r.selfCheck.notes.map((n, i) => <li key={`n${i}`}><Small>· {n}</Small></li>)}
            </ul>
          )}
      </SafeCard>

      <SafeCard>
        <Label>12. Thinking log</Label>
        <Small className="mt-1 block">Sources: {r.log.sources.join(", ") || "none"}</Small>
        <Small className="mt-1 block">Stamped: {new Date(r.log.createdAt).toLocaleTimeString()}</Small>
      </SafeCard>
    </ResponsiveGrid>
  );
}