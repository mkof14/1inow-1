import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { GraduationCap } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/help/learning")({
  component: LearningPage,
});

function LearningPage() {
  const t = useT();
  return (
    <PageContainer>
      <SectionHeader title={t("page.learning.title")} description={t("page.learning.subtitle")} />
      <EmptyState
        icon={GraduationCap}
        title={t("page.learning.emptyTitle")}
        description={t("page.learning.emptyDesc")}
      />
    </PageContainer>
  );
}