import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { IntelligenceBars } from "@/components/icons/compass-icons";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const t = useT();
  return (
    <ComingSoon
      eyebrow={t("page.reports.eyebrow")}
      title={t("page.reports.title")}
      description={t("page.reports.desc")}
      icon={<IntelligenceBars size={140} />}
    />
  );
}