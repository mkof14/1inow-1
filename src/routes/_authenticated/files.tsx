import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Inbox, CheckSquare, Loader2, Search } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { VaultMark } from "@/components/icons/compass-icons";
import { useSetPageContext } from "@/lib/ai-context";
import { useI18n, useT } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { filesSearchStubMessage, vaultSearchResultMessage } from "@/lib/voice-files-actions";
import { searchVault, type VaultSearchHit } from "@/lib/vault-search";

export const Route = createFileRoute("/_authenticated/files")({
  validateSearch: (search: Record<string, unknown>) => {
    const q = typeof search.q === "string" ? search.q : undefined;
    return { q: q || undefined };
  },
  component: FilesPage,
});

type FilesSearch = {
  q?: string;
};

const KIND_LABEL: Record<VaultSearchHit["kind"], { en: string; ru: string; icon: typeof FolderKanban }> = {
  project: { en: "Project", ru: "Проект", icon: FolderKanban },
  task: { en: "Task", ru: "Задача", icon: CheckSquare },
  inbox: { en: "Voice Inbox", ru: "Voice Inbox", icon: Inbox },
};

function FilesPage() {
  const t = useT();
  const { locale } = useI18n();
  const { q: searchQ } = Route.useSearch() as FilesSearch;
  const navigate = useNavigate();
  const [draftQ, setDraftQ] = useState(searchQ ?? "");

  useSetPageContext(
    {
      route: "/files",
      scope: "files",
      title: searchQ ? `Vault: ${searchQ}` : "Vault",
    },
    [searchQ],
  );

  useEffect(() => {
    setDraftQ(searchQ ?? "");
  }, [searchQ]);

  const results = useQuery({
    queryKey: ["vault-search", searchQ],
    queryFn: () => searchVault(searchQ ?? ""),
    enabled: Boolean(searchQ?.trim()),
  });

  useEffect(() => {
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string; toast?: boolean }>).detail;
      if (!detail?.query) return;
      void navigate({ to: "/files", search: { q: detail.query }, replace: true });
      if (detail.toast !== false) {
        void searchVault(detail.query).then((hits) => {
          toast.message(vaultSearchResultMessage(hits.length, locale, detail.query), {
            description: detail.query,
          });
        });
      }
    };
    window.addEventListener("1inow:files-focus", onFocus);
    return () => window.removeEventListener("1inow:files-focus", onFocus);
  }, [locale, navigate]);

  const runSearch = () => {
    const next = draftQ.trim();
    void navigate({ to: "/files", search: next ? { q: next } : {}, replace: true });
    if (!next) toast.message(filesSearchStubMessage(locale));
  };

  const ru = locale === "ru" || locale === "uk";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            placeholder={t("page.files.searchPlaceholder", "Search projects, tasks, notes…")}
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={runSearch}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t("page.files.search", "Search")}
        </button>
      </div>

      {searchQ?.trim() ? (
        <div className="rounded-2xl border bg-card p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {ru ? `Результаты: «${searchQ}»` : `Results for «${searchQ}»`}
            </h2>
            {results.isSuccess && (
              <Badge variant="secondary">{results.data.length}</Badge>
            )}
          </div>

          {results.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("common.thinking")}
            </div>
          ) : results.isError ? (
            <p className="text-sm text-destructive">{t("common.failed")}</p>
          ) : results.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("page.files.noResults", "No matches in projects, tasks, or voice inbox.")}
            </p>
          ) : (
            <ul className="divide-y">
              {results.data.map((hit) => {
                const meta = KIND_LABEL[hit.kind];
                const Icon = meta.icon;
                return (
                  <li key={`${hit.kind}-${hit.id}`}>
                    <Link
                      to={hit.href}
                      className="flex items-start gap-3 py-3 transition-colors hover:text-accent"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{hit.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {ru ? meta.ru : meta.en}
                          </Badge>
                        </div>
                        {hit.snippet ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{hit.snippet}</p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-4 text-[11px] text-muted-foreground">
            {t(
              "page.files.searchNote",
              "Searches projects, tasks, and voice inbox. Dedicated file uploads are coming next.",
            )}
          </p>
        </div>
      ) : (
        <ComingSoon
          eyebrow={t("page.files.eyebrow")}
          title={t("page.files.title")}
          description={t("page.files.desc")}
          icon={<VaultMark size={140} />}
        />
      )}
    </div>
  );
}
