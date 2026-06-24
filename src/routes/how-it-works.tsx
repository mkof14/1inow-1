import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage } from "@/components/public-info-page";
import { useI18n } from "@/lib/i18n";
import { getPublicInfoPage } from "@/lib/public-info-pages";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How 1inow Works - Personal Command Center" },
      {
        name: "description",
        content:
          "How 1inow captures signals, organizes context, turns inputs into next actions, and keeps projects and life tasks moving.",
      },
      { property: "og:title", content: "How 1inow Works" },
      {
        property: "og:description",
        content:
          "A practical operating flow for voice capture, projects, tasks, decisions, review, and controlled intelligence.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/how-it-works" }],
  }),
  component: HowItWorksRoute,
});

function HowItWorksRoute() {
  const { lang } = useI18n();
  return <PublicInfoPage kind="how-it-works" content={getPublicInfoPage("how-it-works", lang)} />;
}
