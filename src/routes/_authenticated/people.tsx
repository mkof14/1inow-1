import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchProfiles } from "@/lib/queries";
import { PeopleOrbit } from "@/components/icons/compass-icons";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List, Globe } from "lucide-react";
import { useSetPageContext } from "@/lib/ai-context";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/people")({ component: PeoplePage });

function PeoplePage() {
  const t = useT();
  const profiles = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [focusedPerson, setFocusedPerson] = useState<{ id: string; name: string } | null>(null);

  useSetPageContext(
    {
      route: "/people",
      scope: "people",
      title: focusedPerson?.name ?? "People",
      ids: { personId: focusedPerson?.id },
    },
    [focusedPerson?.id, focusedPerson?.name],
  );

  useEffect(() => {
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string; personId?: string; personName?: string }>)
        .detail;
      if (detail?.query) setQ(detail.query);
      if (detail?.personId && detail?.personName) {
        setFocusedPerson({ id: detail.personId, name: detail.personName });
      }
    };
    window.addEventListener("1inow:people-focus", onFocus);
    return () => window.removeEventListener("1inow:people-focus", onFocus);
  }, []);

  useEffect(() => {
    if (focusedPerson && q && !`${focusedPerson.name}`.toLowerCase().includes(q.toLowerCase())) {
      setFocusedPerson(null);
    }
  }, [q, focusedPerson]);

  const rows = (profiles.data ?? []).filter((p: any) => {
    if (!q) return true;
    const t =
      `${p.full_name ?? ""} ${p.email ?? ""} ${p.position ?? ""} ${p.department ?? ""}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-start sm:justify-between mb-6 gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="text-accent shrink-0">
            <PeopleOrbit size={44} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl sm:text-2xl font-semibold tracking-tight font-display">
              {t("page.people.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {t("page.people.subtitle")}
            </p>
          </div>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-auto">
          <Link
            to="/team-map"
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium shrink-0"
          >
            <Globe className="size-3.5 shrink-0" />{" "}
            <span className="truncate">{t("page.people.teamMap")}</span>
          </Link>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-card shrink-0">
            {[
              { id: "grid", icon: LayoutGrid, label: "Grid" },
              { id: "table", icon: List, label: "Table" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id as any)}
                className={`px-2.5 h-7 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition shrink-0 ${
                  view === v.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <v.icon className="size-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("page.people.searchPh")}
          className="pl-9 h-9"
        />
      </div>

      {view === "grid" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((p: any) => (
            <button
              type="button"
              key={p.id}
              onClick={() =>
                setFocusedPerson({
                  id: p.id,
                  name: p.full_name ?? p.email ?? "Member",
                })
              }
              className={`rounded-xl border bg-card p-5 flex items-center gap-4 hover:border-accent/40 transition text-left w-full ${
                focusedPerson?.id === p.id ? "border-accent/50 ring-1 ring-accent/30" : "border-border"
              }`}
            >
              <div className="relative">
                <div className="size-12 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground grid place-items-center font-semibold">
                  {(p.full_name || p.email || "?").slice(0, 2).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${
                    p.online_status === "online"
                      ? "bg-emerald-500"
                      : p.online_status === "busy"
                        ? "bg-rose-500"
                        : p.online_status === "away"
                          ? "bg-amber-500"
                          : "bg-muted-foreground/40"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.full_name ?? p.email}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.position ?? t("page.people.member")} · {p.department ?? "—"}
                </div>
                {p.timezone && (
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {p.country ?? ""} · {p.timezone}
                  </div>
                )}
              </div>
            </button>
          ))}
          {rows.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground p-8 border border-dashed border-border rounded-xl">
              {t("page.people.noMatch")}
            </div>
          )}
        </div>
      )}

      {view === "table" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left">
                {[
                  t("tbl.name"),
                  t("tbl.role"),
                  t("tbl.department"),
                  t("tbl.timezone"),
                  t("tbl.status"),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p: any) => (
                <tr
                  key={p.id}
                  onClick={() =>
                    setFocusedPerson({
                      id: p.id,
                      name: p.full_name ?? p.email ?? "Member",
                    })
                  }
                  className={`border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer ${
                    focusedPerson?.id === p.id ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{p.full_name ?? p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.position ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.department ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.timezone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        p.online_status === "online"
                          ? "text-emerald-600"
                          : p.online_status === "busy"
                            ? "text-rose-600"
                            : p.online_status === "away"
                              ? "text-amber-600"
                              : "text-muted-foreground"
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />{" "}
                      {p.online_status ?? "offline"}
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
