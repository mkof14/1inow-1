import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage } from "@/components/public-info-page";
import { useI18n } from "@/lib/i18n";
import { getPublicInfoPage } from "@/lib/public-info-pages";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap - 1inow" },
      {
        name: "description",
        content:
          "The public development roadmap for 1inow: product foundation, data model, project and task engine, notifications, admin, and approved AI later.",
      },
      { property: "og:title", content: "Roadmap - 1inow" },
      {
        property: "og:description",
        content:
          "A practical production path for building 1inow without connecting unnecessary external services too early.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/roadmap" }],
  }),
  component: RoadmapRoute,
});

function RoadmapRoute() {
  const { lang } = useI18n();
  return <PublicInfoPage kind="roadmap" content={getPublicInfoPage("roadmap", lang)} />;
}
