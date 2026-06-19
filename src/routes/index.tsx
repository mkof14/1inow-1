import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "1inow — Command Workspace for Investment Teams" },
      { name: "description", content: "Run portfolio, signals, decisions, people, and knowledge from one private command workspace built for investment teams." },
      { property: "og:title", content: "1inow — Command Workspace for Investment Teams" },
      { property: "og:description", content: "Run portfolio, signals, decisions, people, and knowledge from one private command workspace built for investment teams." },
      { property: "og:url", content: "https://investspace-hub.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://investspace-hub.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return <Navigate to="/dashboard" replace />;
}
