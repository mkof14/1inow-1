import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  CheckSquare,
  FolderKanban,
  Gavel,
  Inbox,
  Loader2,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import {
  searchWorkspace,
  type WorkspaceSearchHit,
  type WorkspaceSearchKind,
} from "@/lib/workspace-search";

const KIND_META: Record<
  WorkspaceSearchKind,
  { icon: typeof FolderKanban; labelKey: string; fallback: string }
> = {
  project: { icon: FolderKanban, labelKey: "search.kind.project", fallback: "Project" },
  task: { icon: CheckSquare, labelKey: "search.kind.task", fallback: "Task" },
  inbox: { icon: Inbox, labelKey: "search.kind.inbox", fallback: "Voice Inbox" },
  memory: { icon: Brain, labelKey: "search.kind.memory", fallback: "Memory" },
  decision: { icon: Gavel, labelKey: "search.kind.decision", fallback: "Decision" },
};

export function WorkspaceSearchPanel({
  scope,
  query,
  draftQ,
  onDraftChange,
  onSearch,
  resultsTitle,
  emptyNote,
}: {
  scope: "vault" | "documents" | "all";
  query?: string;
  draftQ: string;
  onDraftChange: (v: string) => void;
  onSearch: () => void;
  resultsTitle?: string;
  emptyNote?: string;
}) {
  const t = useT();
  const activeQ = query?.trim();

  const results = useQuery({
    queryKey: ["workspace-search", scope, activeQ],
    queryFn: () => searchWorkspace(activeQ ?? "", scope),
    enabled: Boolean(activeQ),
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draftQ}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder={t("page.files.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t("page.files.search", "Search")}
        </button>
      </div>

      {activeQ ? (
        <div className="rounded-2xl border bg-card p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {resultsTitle ?? t("page.files.resultsFor", "Results for «{q}»").replace("{q}", activeQ)}
            </h2>
            {results.isSuccess && <Badge variant="secondary">{results.data.length}</Badge>}
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
              {t("page.files.noResults")}
            </p>
          ) : (
            <ul className="divide-y">
              {results.data.map((hit) => (
                <SearchHitRow key={`${hit.kind}-${hit.id}`} hit={hit} />
              ))}
            </ul>
          )}

          {emptyNote ? (
            <p className="mt-4 text-[11px] text-muted-foreground">{emptyNote}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function SearchHitRow({ hit }: { hit: WorkspaceSearchHit }) {
  const t = useT();
  const meta = KIND_META[hit.kind];
  const Icon = meta.icon;
  return (
    <li>
      <Link to={hit.href} className="flex items-start gap-3 py-3 transition-colors hover:text-accent">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{hit.title}</span>
            <Badge variant="outline" className="text-[10px]">
              {t(meta.labelKey, meta.fallback)}
            </Badge>
          </div>
          {hit.snippet ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{hit.snippet}</p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
