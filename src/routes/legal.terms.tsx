import { createFileRoute } from "@tanstack/react-router";
import { PublicLegalPage } from "@/components/public-legal-page";
import { useI18n } from "@/lib/i18n";
import { getPublicLegalContent } from "@/lib/public-legal";
import { publicPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/legal/terms")({
  head: () =>
    publicPageMeta({
      title: "Terms of Use - 1inow",
      description:
        "Public terms baseline for 1inow, covering product status, accounts, user content, AI status, and external services.",
      path: "/legal/terms",
      type: "article",
    }),
  component: TermsRoute,
});

function TermsRoute() {
  const { lang } = useI18n();
  return <PublicLegalPage kind="terms" content={getPublicLegalContent("terms", lang)} />;
}
