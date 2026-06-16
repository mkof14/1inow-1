import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, saveSettings } from "@/lib/wave1";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageSkeleton } from "@/components/empty-state";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["user-settings"], queryFn: fetchSettings });
  const [form, setForm] = useState({
    language: "en", timezone: "UTC", theme: "light", default_project_view: "board",
    notif_email: true, notif_inapp: true, notif_mentions: true, notif_deadlines: true,
    wh_start: "09:00", wh_end: "18:00",
  });

  useEffect(() => {
    if (!data) return;
    const notif = (data.notifications ?? {}) as Record<string, boolean>;
    const wh = (data.working_hours ?? {}) as Record<string, string>;
    setForm({
      language: data.language, timezone: data.timezone, theme: data.theme,
      default_project_view: data.default_project_view,
      notif_email: notif.email !== false, notif_inapp: notif.inapp !== false,
      notif_mentions: notif.mentions !== false, notif_deadlines: notif.deadlines !== false,
      wh_start: wh.start ?? "09:00", wh_end: wh.end ?? "18:00",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveSettings({
      language: form.language, timezone: form.timezone, theme: form.theme,
      default_project_view: form.default_project_view,
      notifications: { email: form.notif_email, inapp: form.notif_inapp, mentions: form.notif_mentions, deadlines: form.notif_deadlines },
      working_hours: { start: form.wh_start, end: form.wh_end, days: [1, 2, 3, 4, 5] },
    }),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["user-settings"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Personal preferences for your workspace.</p>

      <div className="space-y-8">
        <Section title="Preferences">
          <Field label="Language">
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ro">Română</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Timezone">
            <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </Field>
          <Field label="Theme">
            <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default project view">
            <Select value={form.default_project_view} onValueChange={(v) => setForm({ ...form, default_project_view: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="board">Board</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Working hours">
          <Field label="Start"><Input type="time" value={form.wh_start} onChange={(e) => setForm({ ...form, wh_start: e.target.value })} /></Field>
          <Field label="End"><Input type="time" value={form.wh_end} onChange={(e) => setForm({ ...form, wh_end: e.target.value })} /></Field>
        </Section>

        <Section title="Notifications">
          <Toggle label="Email" v={form.notif_email} onChange={(b) => setForm({ ...form, notif_email: b })} />
          <Toggle label="In-app" v={form.notif_inapp} onChange={(b) => setForm({ ...form, notif_inapp: b })} />
          <Toggle label="Mentions" v={form.notif_mentions} onChange={(b) => setForm({ ...form, notif_mentions: b })} />
          <Toggle label="Deadlines" v={form.notif_deadlines} onChange={(b) => setForm({ ...form, notif_deadlines: b })} />
        </Section>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 col-span-1">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </div>
  );
}