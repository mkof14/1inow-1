import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { FileText } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/legal/terms")({
  component: TermsPage,
});

function TermsPage() {
  const t = useT();
  return (
    <PageContainer size="narrow">
      <SectionHeader title={t("page.terms.title")} description={t("page.terms.subtitle")} />
      <EmptyState
        icon={FileText}
        title={t("page.terms.emptyTitle")}
        description={t("page.terms.emptyDesc")}
      />
    </PageContainer>
  );
}