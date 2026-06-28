import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage } from "@/components/public-info-page";
import { useI18n } from "@/lib/i18n";
import { getPublicInfoPage } from "@/lib/public-info-pages";
import { publicPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    publicPageMeta({
      title: "How 1inow Works - Personal Command Center",
      description:
        "How 1inow captures signals, organizes context, turns inputs into next actions, and keeps projects and life tasks moving.",
      path: "/how-it-works",
      type: "article",
    }),
  component: HowItWorksRoute,
});

function HowItWorksRoute() {
  const { lang } = useI18n();
  return <PublicInfoPage kind="how-it-works" content={getPublicInfoPage("how-it-works", lang)} />;
}
