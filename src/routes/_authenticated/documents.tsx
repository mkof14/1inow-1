import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ComingSoon } from "@/components/coming-soon";
import { KnowledgeLens } from "@/components/icons/compass-icons";
import { WorkspaceSearchPanel } from "@/components/workspace-search-panel";
import { useSetPageContext } from "@/lib/ai-context";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/documents")({
  validateSearch: (search: Record<string, unknown>) => {
    const q = typeof search.q === "string" ? search.q : undefined;
    return { q: q || undefined };
  },
  component: DocumentsPage,
});

type DocumentsSearch = {
  q?: string;
};

function DocumentsPage() {
  const t = useT();
  const { q: searchQ } = Route.useSearch() as DocumentsSearch;
  const navigate = useNavigate();
  const [draftQ, setDraftQ] = useState(searchQ ?? "");

  useSetPageContext(
    {
      route: "/documents",
      scope: "documents",
      title: searchQ ? `Documents: ${searchQ}` : "Documents",
    },
    [searchQ],
  );

  useEffect(() => {
    setDraftQ(searchQ ?? "");
  }, [searchQ]);

  const runSearch = () => {
    const next = draftQ.trim();
    void navigate({ to: "/documents", search: next ? { q: next } : {}, replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <WorkspaceSearchPanel
        scope="documents"
        query={searchQ}
        draftQ={draftQ}
        onDraftChange={setDraftQ}
        onSearch={runSearch}
        resultsTitle={
          searchQ
            ? t("page.documents.resultsFor", "Knowledge results for «{q}»").replace("{q}", searchQ)
            : undefined
        }
        emptyNote={t("page.documents.searchNote")}
      />

      {!searchQ?.trim() ? (
        <ComingSoon
          eyebrow={t("page.documents.eyebrow")}
          title={t("page.documents.title")}
          description={t("page.documents.desc")}
          icon={<KnowledgeLens size={140} />}
        />
      ) : null}
    </div>
  );
}
