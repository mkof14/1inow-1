import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { KnowledgeLens } from "@/components/icons/compass-icons";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const t = useT();
  return (
    <ComingSoon
      eyebrow={t("page.documents.eyebrow")}
      title={t("page.documents.title")}
      description={t("page.documents.desc")}
      icon={<KnowledgeLens size={140} />}
    />
  );
}
