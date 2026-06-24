import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/team-map")({
  component: TeamMapPage,
});

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
  const { data: members, isLoading } = useQuery({
    queryKey: ["team-map-members"],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, avatar_url, country, city, timezone, preferred_language, online_status, office_status",
        )
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  // tick every minute to refresh local times
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">{t("teamMap.title")}</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">{t("teamMap.subtitle")}</p>

      {!members?.length ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
          {t("teamMap.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((m) => {
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
            return (
              <div
                key={m.id}
                className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
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
