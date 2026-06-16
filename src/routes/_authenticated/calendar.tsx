import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { TimelinePulse } from "@/components/icons/compass-icons";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: () => (
    <ComingSoon
      eyebrow="Timeline"
      title="Timeline"
      description="Meetings, deadlines, milestones, launches and decisions across the portfolio."
      icon={<TimelinePulse size={140} />}
    />
  ),
});