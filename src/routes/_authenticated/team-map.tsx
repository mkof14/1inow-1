import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceProfiles } from "@/lib/organization-model";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSetPageContext } from "@/lib/ai-context";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/team-map")({
  validateSearch: (search: Record<string, unknown>) => {
    const status = typeof search.status === "string" ? search.status : undefined;
    const timezone = typeof search.timezone === "string" ? search.timezone : undefined;
    return {
      status: status || undefined,
      timezone: timezone || undefined,
    };
  },
  component: TeamMapPage,
});

type TeamMapSearch = {
  status?: string;
  timezone?: string;
};

type Member = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  preferred_language: string | null;
  online_status: string | null;
  office_status: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  away: "bg-yellow-500",
  dnd: "bg-rose-500",
  offline: "bg-muted-foreground/40",
};

const FLAGS: Record<string, string> = {
  UA: "🇺🇦",
  US: "🇺🇸",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  ES: "🇪🇸",
  PL: "🇵🇱",
  RO: "🇷🇴",
  IT: "🇮🇹",
  PT: "🇵🇹",
  RU: "🇷🇺",
  NL: "🇳🇱",
  CA: "🇨🇦",
  AU: "🇦🇺",
  IN: "🇮🇳",
};

function flagFor(country: string | null) {
  if (!country) return "🌐";
  const code = country.toUpperCase().slice(0, 2);
  return FLAGS[code] ?? "🏳️";
}

function TeamMapPage() {
  const t = useT();
  const navigate = useNavigate();
  const { status: searchStatus, timezone: searchTimezone } = Route.useSearch() as TeamMapSearch;
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(searchStatus ?? "all");
  const [timezoneFilter, setTimezoneFilter] = useState<string>(searchTimezone ?? "");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useSetPageContext(
    {
      route: "/team-map",
      scope: "team-map",
      title: "Team Map",
      ids: focusedMemberId ? { personId: focusedMemberId } : undefined,
    },
    [focusedMemberId],
  );
  const { data: members, isLoading } = useQuery({
    queryKey: ["team-map-members"],
    queryFn: async (): Promise<Member[]> => {
      const data = await fetchWorkspaceProfiles(
        "id, full_name, email, avatar_url, country, city, timezone, preferred_language, online_status, office_status",
      );
      return data as Member[];
    },
  });

  useEffect(() => {
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<{
        memberId?: string;
        memberName?: string;
        query?: string;
        status?: string;
        timezone?: string;
      }>).detail;
      if (detail?.status) setStatusFilter(detail.status);
      if (detail?.timezone !== undefined) setTimezoneFilter(detail.timezone);
      if (detail?.memberId) {
        setFocusedMemberId(detail.memberId);
      } else if (detail?.query && members?.length) {
        const needle = detail.query.toLowerCase();
        const hit = members.find(
          (m) =>
            (m.full_name ?? "").toLowerCase().includes(needle) ||
            m.email.toLowerCase().includes(needle),
        );
        if (hit) setFocusedMemberId(hit.id);
      }
    };
    window.addEventListener("1inow:team-map-focus", onFocus);
    return () => window.removeEventListener("1inow:team-map-focus", onFocus);
  }, [members]);

  useEffect(() => {
    if (searchStatus) setStatusFilter(searchStatus);
    if (searchTimezone !== undefined) setTimezoneFilter(searchTimezone);
  }, [searchStatus, searchTimezone]);

  useEffect(() => {
    const desired: TeamMapSearch = {};
    if (statusFilter && statusFilter !== "all") desired.status = statusFilter;
    if (timezoneFilter) desired.timezone = timezoneFilter;
    const same =
      (searchStatus ?? "all") === (desired.status ?? "all") &&
      (searchTimezone ?? "") === (desired.timezone ?? "");
    if (same) return;
    void navigate({ to: "/team-map", search: desired, replace: true });
  }, [statusFilter, timezoneFilter, searchStatus, searchTimezone, navigate]);

  useEffect(() => {
    if (!focusedMemberId) return;
    const node = cardRefs.current[focusedMemberId];
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const timer = window.setTimeout(() => setFocusedMemberId(null), 6000);
    return () => window.clearTimeout(timer);
  }, [focusedMemberId, members]);

  // tick every minute to refresh local times
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  if (isLoading) return <PageSkeleton />;

  const visibleMembers = (members ?? []).filter((m) => {
    if (statusFilter !== "all" && (m.online_status || "offline") !== statusFilter) return false;
    if (timezoneFilter) {
      const tz = (m.timezone || "UTC").toLowerCase();
      if (!tz.includes(timezoneFilter.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">{t("teamMap.title")}</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{t("teamMap.subtitle")}</p>

      {(statusFilter !== "all" || timezoneFilter) && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1">
              {t(`status.${statusFilter}`, statusFilter)}
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStatusFilter("all")}>
                ×
              </button>
            </span>
          )}
          {timezoneFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1">
              TZ: {timezoneFilter}
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setTimezoneFilter("")}>
                ×
              </button>
            </span>
          )}
          <span className="text-muted-foreground">
            {visibleMembers.length} / {members?.length ?? 0}
          </span>
        </div>
      )}

      {!members?.length ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
          {t("teamMap.empty")}
        </div>
      ) : visibleMembers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
          {t("teamMap.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleMembers.map((m) => {
            const tz = m.timezone || "UTC";
            let localTime = "—";
            try {
              localTime = new Intl.DateTimeFormat(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: tz,
              }).format(new Date());
            } catch {
              /* invalid tz */
            }
            const initials = (m.full_name || m.email || "?")
              .split(/\s|@/)[0]
              .slice(0, 2)
              .toUpperCase();
            const status = m.online_status || "offline";
            const focused = focusedMemberId === m.id;
            return (
              <div
                key={m.id}
                ref={(node) => {
                  cardRefs.current[m.id] = node;
                }}
                className={cn(
                  "rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow",
                  focused
                    ? "border-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                        {initials}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card ${STATUS_COLOR[status] ?? STATUS_COLOR.offline}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.full_name || m.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                  </div>
                  <span className="text-xl leading-none">{flagFor(m.country)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">{t("common.country")}</div>
                    <div className="font-medium">
                      {m.country || "—"}
                      {m.city ? `, ${m.city}` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("common.timezone")}</div>
                    <div className="font-medium truncate">{tz}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("teamMap.localTime")}</div>
                    <div className="font-medium tabular-nums">{localTime}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("common.language")}</div>
                    <div className="font-medium uppercase">{m.preferred_language || "en"}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`size-1.5 rounded-full ${STATUS_COLOR[status] ?? STATUS_COLOR.offline}`}
                    />
                    {t(`status.${status}`, status)}
                  </span>
                  <span className="text-muted-foreground">
                    {t(`office.${m.office_status || "offline"}`, m.office_status || "")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
