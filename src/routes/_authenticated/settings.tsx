import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, saveSettings } from "@/lib/wave1";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageSkeleton } from "@/components/empty-state";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ensureCurrentProfile } from "@/lib/profile-bootstrap";
import { BillingPanel } from "@/components/billing-panel";
import { AnalyticsPrivacyPanel } from "@/components/analytics-privacy-panel";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { setLang, t } = useI18n();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["user-settings"], queryFn: fetchSettings });
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select(
          "preferred_language, secondary_language, country, city, timezone, date_format, time_format, number_format, auto_translate",
        )
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const [pf, setPf] = useState({
    preferred_language: "en",
    secondary_language: "",
    country: "",
    city: "",
    timezone: "UTC",
    date_format: "yyyy-MM-dd",
    time_format: "HH:mm",
    number_format: "en-US",
    auto_translate: false,
  });
  useEffect(() => {
    const billing = new URLSearchParams(window.location.search).get("billing");
    if (billing === "success") {
      toast.success("Checkout completed. Subscription updates may take a moment.");
    } else if (billing === "cancelled") {
      toast.message("Checkout cancelled.");
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    setPf({
      preferred_language: profile.preferred_language ?? "en",
      secondary_language: profile.secondary_language ?? "",
      country: profile.country ?? "",
      city: profile.city ?? "",
      timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      date_format: profile.date_format ?? "yyyy-MM-dd",
      time_format: profile.time_format ?? "HH:mm",
      number_format: profile.number_format ?? "en-US",
      auto_translate: profile.auto_translate ?? false,
    });
  }, [profile]);
  const [form, setForm] = useState({
    language: "en",
    timezone: "UTC",
    theme: "light",
    default_project_view: "board",
    notif_email: true,
    notif_inapp: true,
    notif_mentions: true,
    notif_deadlines: true,
    wh_start: "09:00",
    wh_end: "18:00",
  });

  useEffect(() => {
    if (!data) return;
    const notif = (data.notifications ?? {}) as Record<string, boolean>;
    const wh = (data.working_hours ?? {}) as Record<string, string>;
    setForm({
      language: data.language,
      timezone: data.timezone,
      theme: data.theme,
      default_project_view: data.default_project_view,
      notif_email: notif.email !== false,
      notif_inapp: notif.inapp !== false,
      notif_mentions: notif.mentions !== false,
      notif_deadlines: notif.deadlines !== false,
      wh_start: wh.start ?? "09:00",
      wh_end: wh.end ?? "18:00",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      saveSettings({
        language: form.language,
        timezone: form.timezone,
        theme: form.theme,
        default_project_view: form.default_project_view,
        notifications: {
          email: form.notif_email,
          inapp: form.notif_inapp,
          mentions: form.notif_mentions,
          deadlines: form.notif_deadlines,
        },
        working_hours: { start: form.wh_start, end: form.wh_end, days: [1, 2, 3, 4, 5] },
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <PageSkeleton />;

  const saveProfile = async () => {
    if (!user) return;
    await ensureCurrentProfile(user);
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        preferred_language: pf.preferred_language,
        secondary_language: pf.secondary_language || null,
        country: pf.country || null,
        city: pf.city || null,
        timezone: pf.timezone,
        date_format: pf.date_format,
        time_format: pf.time_format,
        number_format: pf.number_format,
        auto_translate: pf.auto_translate,
      },
      { onConflict: "id" },
    );
    if (error) return toast.error(error.message);
    setLang(pf.preferred_language);
    toast.success(t("common.save"));
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{t("settings.title")}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t("settings.subtitle")}</p>

      <div className="space-y-8">
        <Section title={`🌐 ${t("common.language")} & ${t("common.timezone")}`}>
          <Field label={t("settings.preferredLanguage")}>
            <Select
              value={pf.preferred_language}
              onValueChange={(v) => {
                setPf({ ...pf, preferred_language: v });
                setLang(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(dictionaries).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("settings.secondaryLanguage")}>
            <Select
              value={pf.secondary_language || "none"}
              onValueChange={(v) => setPf({ ...pf, secondary_language: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {Object.keys(dictionaries).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("common.country")}>
            <Input
              value={pf.country}
              onChange={(e) => setPf({ ...pf, country: e.target.value })}
              placeholder="UA / US / DE…"
            />
          </Field>
          <Field label={t("common.city")}>
            <Input value={pf.city} onChange={(e) => setPf({ ...pf, city: e.target.value })} />
          </Field>
          <Field label={t("common.timezone")}>
            <Input
              value={pf.timezone}
              onChange={(e) => setPf({ ...pf, timezone: e.target.value })}
              placeholder="Europe/Kyiv"
            />
          </Field>
          <Field label={t("settings.numberFormat")}>
            <Select
              value={pf.number_format}
              onValueChange={(v) => setPf({ ...pf, number_format: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">1,234.56 (en-US)</SelectItem>
                <SelectItem value="en-GB">1,234.56 (en-GB)</SelectItem>
                <SelectItem value="de-DE">1.234,56 (de-DE)</SelectItem>
                <SelectItem value="uk-UA">1 234,56 (uk-UA)</SelectItem>
                <SelectItem value="ru-RU">1 234,56 (ru-RU)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("settings.dateFormat")}>
            <Select value={pf.date_format} onValueChange={(v) => setPf({ ...pf, date_format: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yyyy-MM-dd">2026-06-16</SelectItem>
                <SelectItem value="dd.MM.yyyy">16.06.2026</SelectItem>
                <SelectItem value="MM/dd/yyyy">06/16/2026</SelectItem>
                <SelectItem value="dd/MM/yyyy">16/06/2026</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("settings.timeFormat")}>
            <Select value={pf.time_format} onValueChange={(v) => setPf({ ...pf, time_format: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HH:mm">24h (14:30)</SelectItem>
                <SelectItem value="hh:mm a">12h (2:30 PM)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 col-span-1 sm:col-span-2">
            <div>
              <div className="text-sm font-medium">{t("common.autoTranslate")}</div>
              <div className="text-xs text-muted-foreground">
                Translate messages not in your preferred language automatically.
              </div>
            </div>
            <Switch
              checked={pf.auto_translate}
              onCheckedChange={(b) => setPf({ ...pf, auto_translate: b })}
            />
          </div>
          <div className="col-span-1 sm:col-span-2 flex justify-end">
            <Button onClick={saveProfile}>{t("settings.saveChanges")}</Button>
          </div>
        </Section>

        <Section title="Preferences">
          <Field label="Language">
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <Input
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            />
          </Field>
          <Field label="Theme">
            <Select
              value={form.theme}
              onValueChange={(v) => {
                setForm({ ...form, theme: v });
                const isDark =
                  v === "dark" ||
                  (v === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                document.documentElement.classList.toggle("dark", isDark);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default project view">
            <Select
              value={form.default_project_view}
              onValueChange={(v) => setForm({ ...form, default_project_view: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
          <Field label="Start">
            <Input
              type="time"
              value={form.wh_start}
              onChange={(e) => setForm({ ...form, wh_start: e.target.value })}
            />
          </Field>
          <Field label="End">
            <Input
              type="time"
              value={form.wh_end}
              onChange={(e) => setForm({ ...form, wh_end: e.target.value })}
            />
          </Field>
        </Section>

        <Section title="Notifications">
          <Toggle
            label="Email"
            v={form.notif_email}
            onChange={(b) => setForm({ ...form, notif_email: b })}
          />
          <Toggle
            label="In-app"
            v={form.notif_inapp}
            onChange={(b) => setForm({ ...form, notif_inapp: b })}
          />
          <Toggle
            label="Mentions"
            v={form.notif_mentions}
            onChange={(b) => setForm({ ...form, notif_mentions: b })}
          />
          <Toggle
            label="Deadlines"
            v={form.notif_deadlines}
            onChange={(b) => setForm({ ...form, notif_deadlines: b })}
          />
        </Section>

        <Section title="Billing">
          <div className="sm:col-span-2">
            <BillingPanel />
          </div>
        </Section>

        <Section title="Privacy">
          <div className="sm:col-span-2">
            <AnalyticsPrivacyPanel />
          </div>
        </Section>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
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
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({
  label,
  v,
  onChange,
}: {
  label: string;
  v: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 col-span-1">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </div>
  );
}
