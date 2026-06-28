import { createFileRoute } from "@tanstack/react-router";
import { PublicLegalPage } from "@/components/public-legal-page";
import { useI18n } from "@/lib/i18n";
import { getPublicLegalContent } from "@/lib/public-legal";
import { publicPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/legal/privacy")({
  head: () =>
    publicPageMeta({
      title: "Privacy Policy - 1inow",
      description:
        "Public privacy baseline for 1inow, covering current data handling, AI status, integrations, and user rights.",
      path: "/legal/privacy",
      type: "article",
    }),
  component: PrivacyRoute,
});

function PrivacyRoute() {
  const { lang } = useI18n();
  return <PublicLegalPage kind="privacy" content={getPublicLegalContent("privacy", lang)} />;
}
