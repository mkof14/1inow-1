import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ExecutionNode } from "@/components/icons/compass-icons";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/my-work")({
  component: MyWork,
});

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string | null;
  project_id: string | null;
  projects?: { name: string; slug: string; color: string | null } | null;
};

function MyWork() {
  const t = useT();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-work", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id,title,status,priority,due_date,assignee_id,created_by,project_id,projects(name,slug,color)",
        )
        .or(`assignee_id.eq.${user!.id},created_by.eq.${user!.id}`)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  if (isLoading) return <PageSkeleton />;
  const tasks = data ?? [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const buckets = {
    assigned: tasks.filter((t) => t.assignee_id === user?.id && t.status !== "done"),
    created: tasks.filter((t) => t.created_by === user?.id),
    today: tasks.filter((t) => t.due_date && new Date(t.due_date) <= today && t.status !== "done"),
    week: tasks.filter((t) => t.due_date && new Date(t.due_date) <= weekEnd && t.status !== "done"),
    overdue: tasks.filter((t) => t.due_date && new Date(t.due_date) < today && t.status !== "done"),
    blocked: tasks.filter((t) => t.status === "blocked"),
    completed: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        icon={<ExecutionNode size={44} />}
        title={t("myWork.title")}
        subtitle={t("myWork.subtitle")}
      />

      <Tabs defaultValue="assigned">
        <TabsList className="flex-wrap h-auto">
          {Object.entries(buckets).map(([k, v]) => (
            <TabsTrigger key={k} value={k} className="capitalize gap-2">
              {t(`myWork.bucket.${k}`, k)}{" "}
              <Badge variant="secondary" className="h-5">
                {v.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(buckets).map(([k, list]) => (
          <TabsContent key={k} value={k} className="mt-5">
            {list.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title={t("myWork.emptyTitle").replace("{bucket}", t(`myWork.bucket.${k}`, k))}
                description={t("myWork.emptyDesc")}
              />
            ) : (
              <div className="rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft overflow-hidden fade-rise">
                {list.map((t, idx) => (
                  <div
                    key={t.id}
                    className="px-4 py-3 border-b border-border/60 last:border-0 flex items-center justify-between hover:bg-accent/5 transition-colors fade-rise"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        {t.projects?.name && <span>{t.projects.name}</span>}
                        {t.due_date && (
                          <span>· Due {new Date(t.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {t.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {t.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
