import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}
