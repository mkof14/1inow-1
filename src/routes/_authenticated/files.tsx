import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ComingSoon } from "@/components/coming-soon";
import { VaultMark } from "@/components/icons/compass-icons";
import { WorkspaceSearchPanel } from "@/components/workspace-search-panel";
import { useSetPageContext } from "@/lib/ai-context";
import { useI18n, useT } from "@/lib/i18n";
import { toast } from "sonner";
import { filesSearchStubMessage, vaultSearchResultMessage } from "@/lib/voice-files-actions";
import { searchVault } from "@/lib/vault-search";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <WorkspaceSearchPanel
        scope="vault"
        query={searchQ}
        draftQ={draftQ}
        onDraftChange={setDraftQ}
        onSearch={runSearch}
        emptyNote={t("page.files.searchNote")}
      />

      {!searchQ?.trim() ? (
        <ComingSoon
          eyebrow={t("page.files.eyebrow")}
          title={t("page.files.title")}
          description={t("page.files.desc")}
          icon={<VaultMark size={140} />}
        />
      ) : null}
    </div>
  );
}
