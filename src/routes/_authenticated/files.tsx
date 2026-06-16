import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { VaultMark } from "@/components/icons/compass-icons";

export const Route = createFileRoute("/_authenticated/files")({
  component: () => (
    <ComingSoon
      eyebrow="Vault"
      title="Vault"
      description="Project folders, brand assets, presentations, contracts and archived media."
      icon={<VaultMark size={140} />}
    />
  ),
});