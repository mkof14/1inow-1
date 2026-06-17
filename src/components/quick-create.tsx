import { useState, useRef, useEffect } from "react";
import { FolderKanban, CheckSquare, FileText, Video, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export function QuickCreate({ openSignal = 0 }: { openSignal?: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const lastSignal = useRef(0);
  useEffect(() => {
    if (openSignal !== lastSignal.current) {
      lastSignal.current = openSignal;
      if (openSignal > 0) setOpen(true);
    }
  }, [openSignal]);
  const [tab, setTab] = useState<"task" | "project" | "note">("task");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const qc = useQueryClient();

  const reset = () => { setTitle(""); setDesc(""); };

  async function submit() {
    if (!title.trim()) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    try {
      if (tab === "task") {
        const { error } = await supabase.from("tasks").insert({
          title, description: desc || null, status: "todo", priority: "medium", created_by: user.id,
        });
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["tasks"] });
        toast.success(t("quick.taskCreated"));
      } else if (tab === "project") {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { error } = await supabase.from("projects").insert({
          name: title, slug, description: desc || null, status: "planning", created_by: user.id,
        });
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["projects"] });
        toast.success(t("quick.projectCreated"));
      } else {
        toast.message(t("quick.notesSoon"));
      }
      reset();
      setOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("common.failed");
      toast.error(msg);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("quick.title")}</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="task"><CheckSquare className="size-3.5 mr-1.5" />{t("quick.tab.task")}</TabsTrigger>
              <TabsTrigger value="project"><FolderKanban className="size-3.5 mr-1.5" />{t("quick.tab.project")}</TabsTrigger>
              <TabsTrigger value="note"><StickyNote className="size-3.5 mr-1.5" />{t("quick.tab.note")}</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="space-y-3 mt-4">
              <Input placeholder={t("quick.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              <Textarea placeholder={t("quick.descPlaceholder")} value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3" /> {t("quick.docs")}
                <Video className="size-3 ml-2" /> {t("quick.meetings")}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={submit} disabled={!title.trim()}>{t("quick.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}