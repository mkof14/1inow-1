import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { AdvisorRing } from "@/components/icons/compass-icons";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AdvisorPage,
});

function AdvisorPage() {
  const t = useT();
  return (
    <ComingSoon
      eyebrow={t("page.advisor.eyebrow")}
      title={t("page.advisor.title")}
      description={t("page.advisor.desc")}
      icon={<AdvisorRing size={140} />}
    />
  );
}