import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  fetchEmailTemplates, upsertEmailTemplate, deleteEmailTemplate,
  renderTemplate, type EmailTemplate,
} from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/administration/emails")({
  component: EmailTemplatesPage,
});

const LANGS = [
  { value: "en", label: "English" },
  { value: "uk", label: "Ukrainian" },
  { value: "ru", label: "Russian" },
  { value: "es", label: "Spanish" },
  { value: "he", label: "Hebrew" },
];
const CATEGORIES = ["auth", "system", "notifications", "reports", "marketing"];

type Editable = Partial<EmailTemplate> & {
  slug: string; language: string; name: string; subject: string; body_html: string;
};

const EMPTY: Editable = {
  slug: "", language: "en", name: "", subject: "", body_html: "",
  category: "system", variables: [], is_active: true, description: "",
};

function EmailTemplatesPage() {
  const t = useT();
  const qc = useQueryClient();
  const templates = useQuery({ queryKey: ["admin-email-templates"], queryFn: fetchEmailTemplates });

  const [editor, setEditor] = useState<Editable | null>(null);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);

  const save = useMutation({
    mutationFn: (t: Editable) => upsertEmailTemplate({
      ...t,
      variables: typeof (t as any).variables === "string"
        ? String((t as any).variables).split(",").map(s => s.trim()).filter(Boolean)
        : (t.variables ?? []),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
      toast.success("Template saved");
      setEditor(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, EmailTemplate[]>();
    for (const t of templates.data ?? []) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return map;
  }, [templates.data]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("page.emails.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("page.emails.subtitle")}</p>
        </div>
        <Button onClick={() => setEditor({ ...EMPTY })}>
          <Plus className="size-4 mr-1.5" /> {t("page.emails.new")}
        </Button>
      </div>

      {templates.isLoading && <Card className="p-8 text-center text-muted-foreground">{t("common.loading")}</Card>}
      {!templates.isLoading && (templates.data?.length ?? 0) === 0 && (
        <Card className="p-8 text-center text-muted-foreground">{t("page.emails.empty")}</Card>
      )}

      {[...grouped.entries()].map(([cat, list]) => (
        <div key={cat} className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h2>
          </div>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">{t("tbl.name")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("tbl.slug")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("tbl.lang")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("tbl.subject")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("tbl.active")}</th>
                  <th className="text-right px-4 py-2.5 font-medium">{t("tbl.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map(t => (
                  <tr key={t.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{t.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.slug}</td>
                    <td className="px-4 py-2.5"><Badge variant="outline">{t.language}</Badge></td>
                    <td className="px-4 py-2.5 truncate max-w-[280px]">{t.subject}</td>
                    <td className="px-4 py-2.5">
                      {t.is_active ? <Badge>active</Badge> : <Badge variant="secondary">off</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setPreview(t)}><Eye className="size-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditor({ ...t })}><Pencil className="size-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => { if (confirm(`Delete "${t.name}"?`)) remove.mutate(t.id); }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ))}

      {/* Editor */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editor?.id ? t("page.emails.editTitle") : t("page.emails.newTitle")}</DialogTitle></DialogHeader>
          {editor && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={editor.slug} onChange={(e) => setEditor({ ...editor, slug: e.target.value })}
                    placeholder="invitation" disabled={!!editor.id} />
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={editor.language} onValueChange={(v) => setEditor({ ...editor, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={editor.category ?? "system"} onValueChange={(v) => setEditor({ ...editor, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={editor.subject} onChange={(e) => setEditor({ ...editor, subject: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>HTML body</Label>
                <Textarea rows={10} className="font-mono text-xs" value={editor.body_html}
                  onChange={(e) => setEditor({ ...editor, body_html: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Variables (comma separated)</Label>
                <Input
                  value={Array.isArray(editor.variables) ? editor.variables.join(", ") : (editor.variables as any) ?? ""}
                  onChange={(e) => setEditor({ ...editor, variables: e.target.value as any })}
                  placeholder="recipient_name, organization_name" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} value={editor.description ?? ""}
                  onChange={(e) => setEditor({ ...editor, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={editor.is_active ?? true}
                  onCheckedChange={(c) => setEditor({ ...editor, is_active: c })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)}>Cancel</Button>
            <Button onClick={() => editor && save.mutate(editor)}
              disabled={!editor?.slug || !editor?.name || !editor?.subject || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview: {preview?.name} <Badge variant="outline" className="ml-2">{preview?.language}</Badge></DialogTitle>
          </DialogHeader>
          {preview && (
            <Tabs defaultValue="rendered">
              <TabsList>
                <TabsTrigger value="rendered">Rendered</TabsTrigger>
                <TabsTrigger value="source">Source</TabsTrigger>
                <TabsTrigger value="vars">Variables</TabsTrigger>
              </TabsList>
              <TabsContent value="rendered" className="space-y-2">
                <div className="text-xs text-muted-foreground">Subject</div>
                <div className="font-medium">{renderTemplate(preview.subject, sampleVars(preview.variables))}</div>
                <div className="text-xs text-muted-foreground mt-3">Body</div>
                <div className="rounded border border-border p-4 bg-background prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: renderTemplate(preview.body_html, sampleVars(preview.variables)) }} />
              </TabsContent>
              <TabsContent value="source">
                <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto">{preview.body_html}</pre>
              </TabsContent>
              <TabsContent value="vars">
                <ul className="text-sm space-y-1">
                  {(preview.variables ?? []).map(v => (
                    <li key={v}><code className="bg-muted/50 px-1.5 py-0.5 rounded">{`{{${v}}}`}</code></li>
                  ))}
                  {(preview.variables ?? []).length === 0 && <li className="text-muted-foreground">No variables declared.</li>}
                </ul>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function sampleVars(keys: string[] | undefined): Record<string, string> {
  const samples: Record<string, string> = {
    recipient_name: "Jane Doe", inviter_name: "Admin",
    organization_name: "Digital Invest Compass", role: "Employee",
    accept_url: "https://app.example.com/accept",
    reset_url: "https://app.example.com/reset",
    app_url: "https://app.example.com",
    expires_at: new Date(Date.now() + 14 * 86400_000).toLocaleDateString(),
    old_role: "Employee", new_role: "Team Lead", actor_name: "Admin",
    summary: "5 tasks completed, 2 projects updated",
  };
  const out: Record<string, string> = {};
  for (const k of keys ?? []) out[k] = samples[k] ?? `[${k}]`;
  return out;
}