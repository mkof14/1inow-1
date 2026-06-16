import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { HelpCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/help/faq")({
  component: FaqPage,
});

function FaqPage() {
  const t = useT();
  return (
    <PageContainer>
      <SectionHeader title={t("page.faq.title")} description={t("page.faq.subtitle")} />
      <EmptyState
        icon={HelpCircle}
        title={t("page.faq.emptyTitle")}
        description={t("page.faq.emptyDesc")}
      />
    </PageContainer>
  );
}