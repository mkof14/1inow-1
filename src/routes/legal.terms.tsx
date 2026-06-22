import { createFileRoute } from "@tanstack/react-router";
import { PublicLegalPage } from "@/components/public-legal-page";
import { useI18n } from "@/lib/i18n";
import { getPublicLegalContent } from "@/lib/public-legal";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use - 1inow" },
      {
        name: "description",
        content:
          "Public terms baseline for 1inow, covering product status, accounts, user content, AI status, and external services.",
      },
      { property: "og:title", content: "Terms of Use - 1inow" },
      {
        property: "og:description",
        content:
          "The public operating terms for the current 1inow development and pre-production base.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/legal/terms" }],
  }),
  component: TermsRoute,
});

function TermsRoute() {
  const { lang } = useI18n();
  return <PublicLegalPage kind="terms" content={getPublicLegalContent("terms", lang)} />;
}
