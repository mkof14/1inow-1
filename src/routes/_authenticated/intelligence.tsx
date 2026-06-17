import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Brain, Bot, Workflow, Shield, ClipboardList, MessageSquareWarning, Database, Lock, History, Settings2, Trash2, Bell } from "lucide-react";
import { BrandMark } from "@/components/icons/compass-mark";

export const Route = createFileRoute("/_authenticated/intelligence")({
  component: IntelligencePage,
});

type Confidence = "high" | "medium" | "low";
type MemoryType =
  | "user_preference" | "project_fact" | "people_fact" | "company_fact"
  | "decision" | "pattern" | "correction" | "workflow" | "writing_style"
  | "communication_style" | "priority" | "deadline" | "risk" | "personal";

const MEMORY_TYPES: MemoryType[] = [
  "user_preference","project_fact","people_fact","company_fact","decision",
  "pattern","correction","workflow","writing_style","communication_style",
  "priority","deadline","risk","personal",
];
const ZONES = ["business","personal","family","health","finance","legal"] as const;
const MODES = ["calm","executive","project_controller","strict_reviewer","fast_operator","personal_helper","silent_observer","critical_monitor"] as const;

function ConfBadge({ c }: { c: Confidence }) {
  const color = c === "high" ? "bg-emerald-500/15 text-emerald-700 border-emerald-300"
    : c === "medium" ? "bg-amber-500/15 text-amber-700 border-amber-300"
    : "bg-rose-500/15 text-rose-700 border-rose-300";
  return <Badge variant="outline" className={color}>{c}</Badge>;
}

function IntelligencePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">1inow</p>
          <h1 className="text-3xl font-semibold tracking-tight">Intelligence</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Truth-first AI grounded in your verified data. What it knows, what it asks, what it does — all under your control.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
          <BrandMark className="h-3.5 w-3.5" /> No invented facts. Confidence is shown on every answer.
        </div>
      </header>

      <Tabs defaultValue="memory">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="memory" className="data-[state=active]:bg-card"><Brain className="mr-1.5 h-4 w-4" />Memory</TabsTrigger>
          <TabsTrigger value="agents"><Bot className="mr-1.5 h-4 w-4" />Agents</TabsTrigger>
          <TabsTrigger value="workflows"><Workflow className="mr-1.5 h-4 w-4" />Workflows</TabsTrigger>
          <TabsTrigger value="rules"><Shield className="mr-1.5 h-4 w-4" />Rules</TabsTrigger>
          <TabsTrigger value="questions"><MessageSquareWarning className="mr-1.5 h-4 w-4" />Questions</TabsTrigger>
          <TabsTrigger value="reminders"><Bell className="mr-1.5 h-4 w-4" />Reminders</TabsTrigger>
          <TabsTrigger value="quality"><Database className="mr-1.5 h-4 w-4" />Data Quality</TabsTrigger>
          <TabsTrigger value="privacy"><Lock className="mr-1.5 h-4 w-4" />Privacy</TabsTrigger>
          <TabsTrigger value="audit"><History className="mr-1.5 h-4 w-4" />Audit</TabsTrigger>
          <TabsTrigger value="prefs"><Settings2 className="mr-1.5 h-4 w-4" />Assistant</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="memory"><MemoryPanel /></TabsContent>
          <TabsContent value="agents"><AgentsPanel /></TabsContent>
          <TabsContent value="workflows"><WorkflowsPanel /></TabsContent>
          <TabsContent value="rules"><RulesPanel /></TabsContent>
          <TabsContent value="questions"><QuestionsPanel /></TabsContent>
          <TabsContent value="reminders"><RemindersPanel /></TabsContent>
          <TabsContent value="quality"><QualityPanel /></TabsContent>
          <TabsContent value="privacy"><PrivacyPanel /></TabsContent>
          <TabsContent value="audit"><AuditPanel /></TabsContent>
          <TabsContent value="prefs"><PrefsPanel /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ----------------- MEMORY -----------------
function MemoryPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["ai_memories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_memories").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState({ type: "project_fact" as MemoryType, key: "", value: "", confidence: "medium" as Confidence, zone: "business" as typeof ZONES[number] });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      const { error } = await supabase.from("ai_memories").insert({ ...form, user_id: u.user.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Memory saved"); setForm({ ...form, key: "", value: "" }); qc.invalidateQueries({ queryKey: ["ai_memories"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: "active" | "paused" | "rejected" | "archived" } }) => {
      const { error } = await supabase.from("ai_memories").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_memories"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_memories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Forgotten"); qc.invalidateQueries({ queryKey: ["ai_memories"] }); },
  });

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <h3 className="text-sm font-medium">What 1inow remembers ({data.length})</h3>
        <p className="mt-1 text-xs text-muted-foreground">Every memory has a source, confidence and zone. Edit, pause or remove anything.</p>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <EmptyHint label="No memories yet. Add one on the right, or correct 1inow in chat and accept the save." />}
          {data.map((m) => (
            <div key={m.id} className="group rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary">{m.type}</Badge>
                    <ConfBadge c={m.confidence as Confidence} />
                    <span className="text-muted-foreground">· {m.zone}</span>
                    {m.status !== "active" && <Badge variant="outline">{m.status}</Badge>}
                  </div>
                  <div className="mt-1.5 text-sm font-medium">{m.key}</div>
                  <div className="text-sm text-muted-foreground">{m.value}</div>
                  {m.source_text && <div className="mt-1 text-xs text-muted-foreground italic">source: {m.source_text}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: m.id, patch: { status: m.status === "paused" ? "active" : "paused" } })}>
                    {m.status === "paused" ? "Resume" : "Pause"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(m.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 h-fit">
        <h3 className="text-sm font-medium">Teach 1inow</h3>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MemoryType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEMORY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Key (short name)</Label>
            <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. AGRON terminology" />
          </div>
          <div>
            <Label className="text-xs">Value</Label>
            <Textarea value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="The fact, preference, or correction" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Confidence</Label>
              <Select value={form.confidence} onValueChange={(v) => setForm({ ...form, confidence: v as Confidence })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["high","medium","low"] as Confidence[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Zone</Label>
              <Select value={form.zone} onValueChange={(v) => setForm({ ...form, zone: v as typeof ZONES[number] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" disabled={!form.key || !form.value || add.isPending} onClick={() => add.mutate()}>Save memory</Button>
        </div>
      </Card>
    </div>
  );
}

// ----------------- AGENTS -----------------
function AgentsPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["ai_agents"],
    queryFn: async () => (await supabase.from("ai_agents").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [draft, setDraft] = useState({ name: "", purpose: "", scope: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      const { error } = await supabase.from("ai_agents").insert({ ...draft, user_id: u.user.id, status: "proposed", min_confidence: "medium" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Agent proposed"); setDraft({ name: "", purpose: "", scope: "" }); qc.invalidateQueries({ queryKey: ["ai_agents"] }); },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "proposed" | "active" | "expired" | "revoked" }) => {
      const { error } = await supabase.from("ai_agents").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_agents"] }),
  });

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <h3 className="text-sm font-medium">Specialist agents</h3>
        <p className="mt-1 text-xs text-muted-foreground">Temporary, scoped helpers. Approve to activate. Revoke any time.</p>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <EmptyHint label="No agents yet. Examples: Legal Reviewer, Investor Materials, Project Risk, Follow-Up." />}
          {data.map((a) => (
            <div key={a.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                    <span className="text-muted-foreground">min confidence: {a.min_confidence}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium">{a.name}</div>
                  <div className="text-sm text-muted-foreground">{a.purpose}</div>
                  {a.scope && <div className="mt-1 text-xs text-muted-foreground">scope: {a.scope}</div>}
                </div>
                <div className="flex gap-1">
                  {a.status !== "active" && <Button size="sm" onClick={() => setStatus.mutate({ id: a.id, status: "active" })}>Approve</Button>}
                  {a.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: a.id, status: "revoked" })}>Revoke</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 h-fit">
        <h3 className="text-sm font-medium">Propose an agent</h3>
        <div className="mt-3 space-y-3 text-sm">
          <div><Label className="text-xs">Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Legal Reviewer" /></div>
          <div><Label className="text-xs">Purpose</Label><Textarea value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} rows={2} placeholder="What it does" /></div>
          <div><Label className="text-xs">Scope</Label><Input value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} placeholder="e.g. contracts only" /></div>
          <Button className="w-full" disabled={!draft.name || !draft.purpose} onClick={() => create.mutate()}>Propose</Button>
        </div>
      </Card>
    </div>
  );
}

// ----------------- WORKFLOWS -----------------
function WorkflowsPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["ai_workflows"],
    queryFn: async () => (await supabase.from("ai_workflows").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      const { error } = await supabase.from("ai_workflows").insert({ name, description: desc, user_id: u.user.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Workflow saved"); setName(""); setDesc(""); qc.invalidateQueries({ queryKey: ["ai_workflows"] }); },
  });
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <h3 className="text-sm font-medium">Learned workflows</h3>
        <p className="mt-1 text-xs text-muted-foreground">Reusable procedures 1inow can run on request.</p>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <EmptyHint label="No workflows yet. Examples: Investor follow-up, Project launch, Contract review." />}
          {data.map((w) => (
            <div key={w.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 text-xs"><Badge variant="secondary">{w.status}</Badge></div>
              <div className="mt-1.5 text-sm font-medium">{w.name}</div>
              {w.description && <div className="text-sm text-muted-foreground">{w.description}</div>}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 h-fit">
        <h3 className="text-sm font-medium">New workflow</h3>
        <div className="mt-3 space-y-3 text-sm">
          <div><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
          <Button className="w-full" disabled={!name} onClick={() => create.mutate()}>Save workflow</Button>
        </div>
      </Card>
    </div>
  );
}

// ----------------- RULES -----------------
function RulesPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["ai_rules"],
    queryFn: async () => (await supabase.from("ai_rules").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [rule, setRule] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      const { error } = await supabase.from("ai_rules").insert({ rule, user_id: u.user.id });
      if (error) throw error;
    },
    onSuccess: () => { setRule(""); qc.invalidateQueries({ queryKey: ["ai_rules"] }); },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("ai_rules").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_rules"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("ai_rules").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_rules"] }),
  });
  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Your rules for 1inow</h3>
      <p className="mt-1 text-xs text-muted-foreground">Plain-language instructions. E.g. "Never send messages on weekends." "Always ask before scheduling with investors."</p>
      <div className="mt-4 flex gap-2">
        <Input value={rule} onChange={(e) => setRule(e.target.value)} placeholder="Add a rule…" onKeyDown={(e) => { if (e.key === "Enter" && rule.trim()) add.mutate(); }} />
        <Button disabled={!rule.trim()} onClick={() => add.mutate()}>Add</Button>
      </div>
      <div className="mt-4 space-y-2">
        {data.length === 0 && <EmptyHint label="No rules yet." />}
        {data.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className={r.active ? "text-sm" : "text-sm text-muted-foreground line-through"}>{r.rule}</div>
            <div className="flex items-center gap-3">
              <Switch checked={r.active} onCheckedChange={(v) => toggle.mutate({ id: r.id, active: v })} />
              <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ----------------- QUESTIONS -----------------
function QuestionsPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["ai_questions"],
    queryFn: async () => (await supabase.from("ai_questions").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const answer = useMutation({
    mutationFn: async ({ id, ans }: { id: string; ans: string }) => {
      const { error } = await supabase.from("ai_questions").update({ answer: ans, status: "answered", answered_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_questions"] }),
  });
  const dismiss = useMutation({
    mutationFn: async (id: string) => { await supabase.from("ai_questions").update({ status: "dismissed" }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_questions"] }),
  });

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Open questions from 1inow</h3>
      <p className="mt-1 text-xs text-muted-foreground">1inow asks only when context is missing or risk is high.</p>
      <div className="mt-4 space-y-2">
        {data.length === 0 && <EmptyHint label="No open questions. 1inow will surface clarifications here when needed." />}
        {data.map((q) => (
          <QuestionRow key={q.id} q={q} onAnswer={(ans) => answer.mutate({ id: q.id, ans })} onDismiss={() => dismiss.mutate(q.id)} />
        ))}
      </div>
    </Card>
  );
}
function QuestionRow({ q, onAnswer, onDismiss }: { q: { id: string; question: string; status: string; answer: string | null }; onAnswer: (s: string) => void; onDismiss: () => void }) {
  const [v, setV] = useState("");
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-xs"><Badge variant="secondary">{q.status}</Badge></div>
      <div className="mt-1.5 text-sm font-medium">{q.question}</div>
      {q.status === "open" ? (
        <div className="mt-2 flex gap-2">
          <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Your answer…" />
          <Button disabled={!v.trim()} onClick={() => onAnswer(v)}>Reply</Button>
          <Button variant="ghost" onClick={onDismiss}>Dismiss</Button>
        </div>
      ) : q.answer ? (
        <div className="mt-2 text-sm text-muted-foreground">→ {q.answer}</div>
      ) : null}
    </div>
  );
}

// ----------------- DATA QUALITY -----------------
function QualityPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["dq_issues"],
    queryFn: async () => (await supabase.from("data_quality_issues").select("*").eq("resolved", false).order("created_at", { ascending: false })).data ?? [],
  });
  const resolve = useMutation({
    mutationFn: async (id: string) => { await supabase.from("data_quality_issues").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dq_issues"] }),
  });
  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Data quality</h3>
      <p className="mt-1 text-xs text-muted-foreground">Duplicates, missing owners, stale documents, conflicts. 1inow scans continuously.</p>
      <div className="mt-4 space-y-2">
        {data.length === 0 && <EmptyHint label="All clear. Nothing to clean up right now." />}
        {data.map((i) => (
          <div key={i.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
            <div>
              <div className="flex items-center gap-2 text-xs"><Badge variant="outline">{i.kind}</Badge><span className="text-muted-foreground">{i.subject_type}</span></div>
              <div className="mt-1.5 text-sm">{i.description}</div>
              {i.suggested_fix && <div className="text-xs text-muted-foreground">Suggested: {i.suggested_fix}</div>}
            </div>
            <Button size="sm" variant="outline" onClick={() => resolve.mutate(i.id)}>Resolve</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ----------------- PRIVACY -----------------
function PrivacyPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["privacy_zones"],
    queryFn: async () => (await supabase.from("user_privacy_zones").select("*")).data ?? [],
  });
  const upsert = useMutation({
    mutationFn: async ({ zone, patch }: { zone: string; patch: { enabled?: boolean; cross_zone_allowed?: boolean } }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      const existing = data.find((d) => d.zone === zone);
      if (existing) {
        const { error } = await supabase.from("user_privacy_zones").update(patch).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_privacy_zones").insert({ user_id: u.user.id, zone: zone as typeof ZONES[number], ...patch });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["privacy_zones"] }),
  });
  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Privacy zones</h3>
      <p className="mt-1 text-xs text-muted-foreground">Keep zones separated. 1inow cannot mix them unless you allow it.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ZONES.map((z) => {
          const row = data.find((d) => d.zone === z);
          const enabled = row?.enabled ?? true;
          const cross = row?.cross_zone_allowed ?? false;
          return (
            <div key={z} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between"><div className="text-sm font-medium capitalize">{z}</div>
                <Switch checked={enabled} onCheckedChange={(v) => upsert.mutate({ zone: z, patch: { enabled: v } })} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Allow cross-zone reference</span>
                <Switch checked={cross} onCheckedChange={(v) => upsert.mutate({ zone: z, patch: { cross_zone_allowed: v } })} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ----------------- AUDIT -----------------
function AuditPanel() {
  const { data: actions = [] } = useQuery({
    queryKey: ["ai_actions"],
    queryFn: async () => (await supabase.from("ai_actions").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const { data: confs = [] } = useQuery({
    queryKey: ["ai_conf"],
    queryFn: async () => (await supabase.from("ai_confidence_logs").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-sm font-medium">AI actions ({actions.length})</h3>
        <p className="mt-1 text-xs text-muted-foreground">Every action 1inow takes is logged.</p>
        <div className="mt-4 space-y-2">
          {actions.length === 0 && <EmptyHint label="No actions yet." />}
          {actions.map((a) => (
            <div key={a.id} className="rounded-lg border bg-card p-3 text-sm">
              <div className="flex items-center gap-2 text-xs"><Badge variant="outline">{a.kind}</Badge><Badge variant="secondary">{a.status}</Badge></div>
              {a.prompt && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.prompt}</div>}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-medium">Confidence log ({confs.length})</h3>
        <p className="mt-1 text-xs text-muted-foreground">Recent answers and how sure 1inow was.</p>
        <div className="mt-4 space-y-2">
          {confs.length === 0 && <EmptyHint label="No entries yet." />}
          {confs.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 text-xs"><ConfBadge c={c.confidence as Confidence} /><span className="text-muted-foreground">{c.subject}</span></div>
              {c.rationale && <div className="mt-1 text-sm text-muted-foreground">{c.rationale}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ----------------- PREFERENCES -----------------
function PrefsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["assistant_prefs"],
    queryFn: async () => (await supabase.from("assistant_preferences").select("*").maybeSingle()).data,
  });
  const save = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      const { error } = await supabase.from("assistant_preferences").upsert({ user_id: u.user.id, ...(data ?? {}), ...patch });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["assistant_prefs"] }); },
  });
  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Assistant mode & noise</h3>
      <p className="mt-1 text-xs text-muted-foreground">Tune the personality, strictness and reach of 1inow.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Mode</Label>
          <Select value={data?.mode ?? "calm"} onValueChange={(v) => save.mutate({ mode: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <NumField label="Strictness (0–4)" value={data?.strictness ?? 2} onChange={(n) => save.mutate({ strictness: n })} />
        <NumField label="Proactive level (0–4)" value={data?.proactive_level ?? 2} onChange={(n) => save.mutate({ proactive_level: n })} />
        <NumField label="Notification level (0–4)" value={data?.notification_level ?? 2} onChange={(n) => save.mutate({ notification_level: n })} />
        <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
          <div>
            <div className="text-sm font-medium">Memory enabled</div>
            <div className="text-xs text-muted-foreground">1inow remembers verified facts you save or accept.</div>
          </div>
          <Switch checked={data?.memory_enabled ?? true} onCheckedChange={(v) => save.mutate({ memory_enabled: v })} />
        </div>
      </div>
    </Card>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} max={4} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">{label}</div>;
}

// ----------------- REMINDERS -----------------
function RemindersPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["ai_reminders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_reminders").select("*").order("reminder_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState({ title: "", message: "", reminder_time: "", priority: "normal" });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      if (!form.title || !form.reminder_time) throw new Error("title and time required");
      const { error } = await supabase.from("ai_reminders").insert({
        user_id: u.user.id,
        title: form.title,
        message: form.message || null,
        reminder_time: new Date(form.reminder_time).toISOString(),
        priority: form.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reminder added");
      setForm({ title: "", message: "", reminder_time: "", priority: "normal" });
      qc.invalidateQueries({ queryKey: ["ai_reminders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ai_reminders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_reminders"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["ai_reminders"] }); },
  });

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <h3 className="text-sm font-medium">Reminders ({data.length})</h3>
        <p className="mt-1 text-xs text-muted-foreground">1inow will surface these at the right moment. Snooze or dismiss anything.</p>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <EmptyHint label="No reminders yet. Add one on the right or ask 1inow to set one in chat." />}
          {data.map((r) => (
            <div key={r.id} className="group rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary">{r.priority}</Badge>
                    {r.status !== "pending" && <Badge variant="outline">{r.status}</Badge>}
                    <span className="text-muted-foreground">· {new Date(r.reminder_time).toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium">{r.title}</div>
                  {r.message && <div className="text-sm text-muted-foreground">{r.message}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  {r.status === "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: r.id, status: "done" })}>Done</Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-medium">Add reminder</h3>
        <div className="space-y-2">
          <Label className="text-xs">Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Call partner about term sheet" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">When</Label>
          <Input type="datetime-local" value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Note</Label>
          <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">Add reminder</Button>
      </Card>
    </div>
  );
}