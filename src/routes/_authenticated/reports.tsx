import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { IntelligenceBars } from "@/components/icons/compass-icons";

export const Route = createFileRoute("/_authenticated/reports")({
  component: () => (
    <ComingSoon
      eyebrow="Intelligence"
      title="Intelligence"
      description="Executive, project, people, communication, task, risk and decision intelligence."
      icon={<IntelligenceBars size={140} />}
    />
  ),
});