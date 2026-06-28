import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage } from "@/components/public-info-page";
import { useI18n } from "@/lib/i18n";
import { getPublicInfoPage } from "@/lib/public-info-pages";
import { publicPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/roadmap")({
  head: () =>
    publicPageMeta({
      title: "Roadmap - 1inow",
      description:
        "The public development roadmap for 1inow: product foundation, data model, project and task engine, notifications, admin, and approved AI later.",
      path: "/roadmap",
      type: "article",
    }),
  component: RoadmapRoute,
});

function RoadmapRoute() {
  const { lang } = useI18n();
  return <PublicInfoPage kind="roadmap" content={getPublicInfoPage("roadmap", lang)} />;
}
