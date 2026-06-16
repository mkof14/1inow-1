import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { Shield } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/legal/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const t = useT();
  return (
    <PageContainer size="narrow">
      <SectionHeader title={t("page.privacy.title")} description={t("page.privacy.subtitle")} />
      <EmptyState
        icon={Shield}
        title={t("page.privacy.emptyTitle")}
        description={t("page.privacy.emptyDesc")}
      />
    </PageContainer>
  );
}