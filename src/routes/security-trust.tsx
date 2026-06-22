import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage } from "@/components/public-info-page";
import { useI18n } from "@/lib/i18n";
import { getPublicInfoPage } from "@/lib/public-info-pages";

export const Route = createFileRoute("/security-trust")({
  head: () => ({
    meta: [
      { title: "Security & Trust - 1inow" },
      {
        name: "description",
        content:
          "1inow security and trust principles: clean environments, explicit permissions, safe AI boundaries, audit trails, and approved integrations.",
      },
      { property: "og:title", content: "Security & Trust - 1inow" },
      {
        property: "og:description",
        content: "A practical trust foundation for the current 1inow production development path.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/security-trust" }],
  }),
  component: SecurityTrustRoute,
});

function SecurityTrustRoute() {
  const { lang } = useI18n();
  return (
    <PublicInfoPage kind="security-trust" content={getPublicInfoPage("security-trust", lang)} />
  );
}
