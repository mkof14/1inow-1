import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { DecisionDiamond } from "@/components/icons/compass-icons";

export const Route = createFileRoute("/_authenticated/approvals")({
  component: () => (
    <ComingSoon
      eyebrow="Decisions"
      title="Decisions"
      description="Pending, approved and reviewed decisions across the portfolio — with full approval trail."
      icon={<DecisionDiamond size={140} />}
    />
  ),
});