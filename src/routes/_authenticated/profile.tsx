import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/empty-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { UserCircle, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile-full", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myProjects } = useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: owned } = await supabase
        .from("projects").select("*").eq("created_by", user.id);
      const { data: memberRows } = await supabase
        .from("project_members").select("project_id").eq("user_id", user.id);
      const memberIds = (memberRows ?? []).map((r: any) => r.project_id);
      let memberProjects: any[] = [];
      if (memberIds.length) {
        const { data } = await supabase
          .from("projects").select("*").in("id", memberIds);
        memberProjects = data ?? [];
      }
      const map = new Map<string, any>();
      [...(owned ?? []), ...memberProjects].forEach((p) => map.set(p.id, p));
      return Array.from(map.values());
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    full_name: "", avatar_url: "", bio: "", phone: "", country: "", city: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      avatar_url: profile.avatar_url ?? "",
      bio: profile.bio ?? "",
      phone: profile.phone ?? "",
      country: profile.country ?? "",
      city: profile.city ?? "",
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-profile-full"] });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <PageSkeleton />;

  const initials = (form.full_name || user?.email || "MK").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader
        icon={<UserCircle className="size-10 text-accent" />}
        title="МК — Мой профиль"
        subtitle={user?.email ?? ""}
      />

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {form.avatar_url ? <AvatarImage src={form.avatar_url} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <Label>Avatar URL</Label>
            <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderKanban className="size-5 text-accent" />
          <h2 className="text-lg font-semibold tracking-tight">Мои проекты</h2>
          <span className="text-xs text-muted-foreground ml-auto">{myProjects?.length ?? 0}</span>
        </div>
        {(!myProjects || myProjects.length === 0) ? (
          <p className="text-sm text-muted-foreground">Проектов пока нет.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {myProjects.map((p: any) => (
              <li key={p.id}>
                <Link
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background hover:border-accent/50 hover:bg-accent/5 p-3 transition-colors"
                >
                  <div
                    className="size-9 shrink-0 rounded-lg grid place-items-center text-white text-xs font-semibold"
                    style={{ background: p.color ?? "#0a2540" }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      {p.status} · {p.progress ?? 0}%
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}