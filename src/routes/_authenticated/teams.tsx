import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { PeopleOrbit } from "@/components/icons/compass-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Users, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/teams")({ component: TeamsPage });

function TeamsPage() {
  const t = useT();
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1400px] mx-auto fade-rise">
      <PageHeader
        icon={<PeopleOrbit size={44} />}
        title={t("teams.title")}
        subtitle={t("teams.subtitle")}
      />
      <Tabs defaultValue="teams" className="mt-2">
        <TabsList>
          <TabsTrigger value="teams">
            <Users className="size-3.5 mr-1.5" />
            {t("teams.tab.teams")}
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="size-3.5 mr-1.5" />
            {t("teams.tab.departments")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="teams" className="mt-5">
          <TeamsList />
        </TabsContent>
        <TabsContent value="departments" className="mt-5">
          <DepartmentsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewDialog({
  onCreate,
  busy,
}: {
  onCreate: (name: string, description: string) => void;
  busy: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setName("");
          setDesc("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4 mr-1" />
          {t("teams.new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("teams.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={t("teams.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder={t("teams.description")}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || busy}
            onClick={() => {
              onCreate(name.trim(), desc.trim());
              setOpen(false);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamsList() {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useAuth();
  const teams = useQuery({
    queryKey: ["teams-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("teams")
        .select("*, team_members(user_id)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const create = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { error } = await (supabase as any)
        .from("teams")
        .insert({ name, description, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team created");
      qc.invalidateQueries({ queryKey: ["teams-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("teams")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["teams-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <div className="flex justify-end mb-3">
        <NewDialog
          onCreate={(name, description) => create.mutate({ name, description })}
          busy={create.isPending}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(teams.data ?? []).map((tm: any) => (
          <div key={tm.id} className="surface-aurora shimmer-border rounded-2xl p-4 group">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display font-semibold truncate">{tm.name}</div>
                {tm.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {tm.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove.mutate(tm.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              {tm.team_members?.length ?? 0} {t("teams.members")}
            </div>
          </div>
        ))}
        {teams.data && teams.data.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full">{t("teams.empty")}</div>
        )}
      </div>
    </div>
  );
}

function DepartmentsList() {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useAuth();
  const depts = useQuery({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("departments")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const create = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { error } = await (supabase as any)
        .from("departments")
        .insert({ name, description, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Department created");
      qc.invalidateQueries({ queryKey: ["departments-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("departments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["departments-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <div className="flex justify-end mb-3">
        <NewDialog
          onCreate={(name, description) => create.mutate({ name, description })}
          busy={create.isPending}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(depts.data ?? []).map((d: any) => (
          <div key={d.id} className="surface-aurora shimmer-border rounded-2xl p-4 group">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display font-semibold truncate">{d.name}</div>
                {d.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {d.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove.mutate(d.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {depts.data && depts.data.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full">{t("teams.empty")}</div>
        )}
      </div>
    </div>
  );
}
