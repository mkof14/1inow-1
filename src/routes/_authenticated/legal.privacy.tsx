import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/legal/privacy")({
  component: () => (
    <PageContainer size="narrow">
      <SectionHeader title="Privacy Policy" description="How we collect, store and process your data." />
      <EmptyState
        icon={Shield}
        title="Policy not published yet"
        description="The privacy policy will appear here once finalised by Legal."
      />
    </PageContainer>
  ),
});