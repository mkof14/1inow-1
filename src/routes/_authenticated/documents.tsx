import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { KnowledgeLens } from "@/components/icons/compass-icons";

export const Route = createFileRoute("/_authenticated/documents")({
  component: () => (
    <ComingSoon
      eyebrow="Knowledge"
      title="Knowledge"
      description="Company knowledge, project notes, policies, templates and multilingual versions."
      icon={<KnowledgeLens size={140} />}
    />
  ),
});