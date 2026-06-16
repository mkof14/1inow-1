import { useState } from "react";
import { Plus, FolderKanban, CheckSquare, FileText, Video, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function QuickCreate({ openSignal = 0 }: { openSignal?: number }) {
  const [open, setOpen] = useState(false);
  // open externally when signal changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // we intentionally watch openSignal only
  const lastSignal = useRef(openSignal);
  if (openSignal !== lastSignal.current) {
    lastSignal.current = openSignal;
    if (openSignal > 0 && !open) setTimeout(() => setOpen(true), 0);
  }
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
        toast.success("Task created");
      } else if (tab === "project") {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { error } = await supabase.from("projects").insert({
          name: title, slug, description: desc || null, status: "planning", created_by: user.id,
        });
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Project created");
      } else {
        toast.message("Notes module coming in Wave 3");
      }
      reset();
      setOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create";
      toast.error(msg);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all grid place-items-center z-40"
        aria-label="Quick create"
      >
        <Plus className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Create</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="task"><CheckSquare className="size-3.5 mr-1.5" />Task</TabsTrigger>
              <TabsTrigger value="project"><FolderKanban className="size-3.5 mr-1.5" />Project</TabsTrigger>
              <TabsTrigger value="note"><StickyNote className="size-3.5 mr-1.5" />Note</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="space-y-3 mt-4">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              <Textarea placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3" /> Documents
                <Video className="size-3 ml-2" /> Meetings — coming soon
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!title.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}