import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ComingSoon } from "@/components/coming-soon";
import { VaultMark } from "@/components/icons/compass-icons";
import { useSetPageContext } from "@/lib/ai-context";
import { useI18n, useT } from "@/lib/i18n";
import { toast } from "sonner";
import { filesSearchStubMessage } from "@/lib/voice-files-actions";

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
  useSetPageContext(
    {
      route: "/files",
      scope: "files",
      title: searchQ ? `Vault: ${searchQ}` : "Vault",
    },
    [searchQ],
  );

  useEffect(() => {
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string; toast?: boolean }>).detail;
      if (!detail?.query) return;
      void navigate({ to: "/files", search: { q: detail.query }, replace: true });
      if (detail.toast !== false) {
        toast.message(filesSearchStubMessage(locale, detail.query), {
          description: detail.query,
        });
      }
    };
    window.addEventListener("1inow:files-focus", onFocus);
    return () => window.removeEventListener("1inow:files-focus", onFocus);
  }, [locale, navigate]);

  return (
    <ComingSoon
      eyebrow={t("page.files.eyebrow")}
      title={searchQ ? `${t("page.files.title")}: ${searchQ}` : t("page.files.title")}
      description={t("page.files.desc")}
      icon={<VaultMark size={140} />}
    />
  );
}
