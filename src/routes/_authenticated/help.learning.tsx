import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/help/learning")({
  component: () => (
    <PageContainer>
      <SectionHeader title="Learning Center" description="Guides, tutorials and onboarding material." />
      <EmptyState
        icon={GraduationCap}
        title="No learning material yet"
        description="Courses and guides will appear here once published."
      />
    </PageContainer>
  ),
});