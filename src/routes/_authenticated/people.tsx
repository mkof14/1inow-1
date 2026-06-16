import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProfiles } from "@/lib/queries";
import { PeopleOrbit } from "@/components/icons/compass-icons";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/people")({ component: PeoplePage });

function PeoplePage() {
  const profiles = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");

  const rows = (profiles.data ?? []).filter((p: any) => {
    if (!q) return true;
    const t = `${p.full_name ?? ""} ${p.email ?? ""} ${p.position ?? ""} ${p.department ?? ""}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="text-accent"><PeopleOrbit size={44} /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-display">People</h1>
            <p className="text-sm text-muted-foreground mt-1">Global team — across timezones, roles and projects.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/team-map" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium">
            <Globe className="size-3.5" /> Team Map
          </Link>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-card">
            {[
              { id: "grid", icon: LayoutGrid, label: "Grid" },
              { id: "table", icon: List, label: "Table" },
            ].map((v) => (
              <button key={v.id} onClick={() => setView(v.id as any)}
                className={`px-2.5 h-7 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition ${
                  view === v.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}><v.icon className="size-3.5" />{v.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className="pl-9 h-9" />
      </div>

      {view === "grid" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((p: any) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-accent/40 transition">
              <div className="relative">
                <div className="size-12 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground grid place-items-center font-semibold">
                  {(p.full_name || p.email || "?").slice(0, 2).toUpperCase()}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${
                  p.online_status === "online" ? "bg-emerald-500" :
                  p.online_status === "busy" ? "bg-rose-500" :
                  p.online_status === "away" ? "bg-amber-500" : "bg-muted-foreground/40"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.full_name ?? p.email}</div>
                <div className="text-xs text-muted-foreground truncate">{p.position ?? "Member"} · {p.department ?? "—"}</div>
                {p.timezone && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{p.country ?? ""} · {p.timezone}</div>}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground p-8 border border-dashed border-border rounded-xl">
              No people match.
            </div>
          )}
        </div>
      )}

      {view === "table" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left">
                {["Name","Role","Department","Timezone","Status"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p: any) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.full_name ?? p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.position ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.department ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.timezone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${
                      p.online_status === "online" ? "text-emerald-600" :
                      p.online_status === "busy" ? "text-rose-600" :
                      p.online_status === "away" ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      <span className="size-1.5 rounded-full bg-current" /> {p.online_status ?? "offline"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}