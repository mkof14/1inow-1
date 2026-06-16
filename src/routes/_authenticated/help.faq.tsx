import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/help/faq")({
  component: () => (
    <PageContainer>
      <SectionHeader title="FAQ" description="Frequently asked questions about Digital Invest Compass." />
      <EmptyState
        icon={HelpCircle}
        title="No questions published yet"
        description="The FAQ will appear here once entries are added by an administrator."
      />
    </PageContainer>
  ),
});