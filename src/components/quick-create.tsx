import { useState, useRef, useEffect } from "react";
import { FolderKanban, CheckSquare, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { createProjectRecord, createTaskRecord } from "@/lib/project-task-engine";
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
  const [tab, setTab] = useState<"task" | "project">("task");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const qc = useQueryClient();

  const reset = () => {
    setTitle("");
    setDesc("");
  };

  async function submit() {
    if (!title.trim()) return;
    try {
      if (tab === "task") {
        await createTaskRecord({ title, description: desc || null });
        qc.invalidateQueries({ queryKey: ["tasks"] });
        toast.success(t("quick.taskCreated"));
      } else if (tab === "project") {
        await createProjectRecord({ name: title, description: desc || null });
        qc.invalidateQueries({ queryKey: ["projects"] });
        toast.success(t("quick.projectCreated"));
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
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="task">
                <CheckSquare className="size-3.5 mr-1.5" />
                {t("quick.tab.task")}
              </TabsTrigger>
              <TabsTrigger value="project">
                <FolderKanban className="size-3.5 mr-1.5" />
                {t("quick.tab.project")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="space-y-3 mt-4">
              <Input
                placeholder={t("quick.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <Textarea
                placeholder={t("quick.descPlaceholder")}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Workflow className="size-3" />
                {tab === "task"
                  ? t("quick.taskHelp", "Creates a trackable action in the execution board.")
                  : t("quick.projectHelp", "Creates an initiative with owner and planning status.")}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={!title.trim()}>
              {t("quick.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
