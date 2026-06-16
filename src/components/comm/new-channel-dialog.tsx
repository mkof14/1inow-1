import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChannel } from "@/lib/comm";
import { toast } from "sonner";

export function NewChannelDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"company" | "private" | "group">("private");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => createChannel({ name, type, description: desc || undefined }),
    onSuccess: (c) => {
      toast.success("Channel created");
      qc.invalidateQueries({ queryKey: ["channels"] });
      setName(""); setDesc("");
      onOpenChange(false);
      if (c?.id) onCreated?.(c.id);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New channel</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Channel name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private — invite only</SelectItem>
              <SelectItem value="group">Group — any member can join</SelectItem>
              <SelectItem value="company">Company-wide</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={!name.trim() || mut.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}