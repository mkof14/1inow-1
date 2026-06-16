import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProfiles } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/people")({ component: PeoplePage });

function PeoplePage() {
  const profiles = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace members.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.data?.map((p: any) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold">
              {(p.full_name || p.email || "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{p.full_name ?? p.email}</div>
              <div className="text-xs text-muted-foreground">{p.position ?? "Member"} · {p.department ?? "—"}</div>
            </div>
          </div>
        ))}
        {(!profiles.data || profiles.data.length === 0) && (
          <div className="col-span-full text-center text-sm text-muted-foreground p-8 border border-dashed border-border rounded-xl">
            Invite teammates to see them here.
          </div>
        )}
      </div>
    </div>
  );
}