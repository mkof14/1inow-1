import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { ShieldLine } from "@/components/icons/compass-icons";

export const Route = createFileRoute("/_authenticated/administration")({
  component: () => (
    <ComingSoon
      eyebrow="Control"
      title="Control"
      description="Users, roles, permissions, departments, languages, audit, security and integrations."
      icon={<ShieldLine size={140} />}
    />
  ),
});