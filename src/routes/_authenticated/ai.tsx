import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { AdvisorRing } from "@/components/icons/compass-icons";

export const Route = createFileRoute("/_authenticated/ai")({
  component: () => (
    <ComingSoon
      eyebrow="Advisor"
      title="Advisor"
      description="Portfolio and project summaries, decision extraction, blocker detection, weekly direction — on demand."
      icon={<AdvisorRing size={140} />}
    />
  ),
});