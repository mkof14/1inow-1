import { createFileRoute } from "@tanstack/react-router";
import { PublicLegalPage } from "@/components/public-legal-page";
import { useI18n } from "@/lib/i18n";
import { getPublicLegalContent } from "@/lib/public-legal";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - 1inow" },
      {
        name: "description",
        content:
          "Public privacy baseline for 1inow, covering current data handling, AI status, integrations, and user rights.",
      },
      { property: "og:title", content: "Privacy Policy - 1inow" },
      {
        property: "og:description",
        content:
          "How 1inow handles data during the current product development and pre-production phase.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/legal/privacy" }],
  }),
  component: PrivacyRoute,
});

function PrivacyRoute() {
  const { lang } = useI18n();
  return <PublicLegalPage kind="privacy" content={getPublicLegalContent("privacy", lang)} />;
}
