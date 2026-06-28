import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage } from "@/components/public-info-page";
import { useI18n } from "@/lib/i18n";
import { getPublicInfoPage } from "@/lib/public-info-pages";
import { publicPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/security-trust")({
  head: () =>
    publicPageMeta({
      title: "Security & Trust - 1inow",
      description:
        "1inow security and trust principles: clean environments, explicit permissions, safe AI boundaries, audit trails, and approved integrations.",
      path: "/security-trust",
      type: "article",
    }),
  component: SecurityTrustRoute,
});

function SecurityTrustRoute() {
  const { lang } = useI18n();
  return (
    <PublicInfoPage kind="security-trust" content={getPublicInfoPage("security-trust", lang)} />
  );
}
