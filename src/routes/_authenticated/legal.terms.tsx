import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageContainer, SectionHeader } from "@/components/layout";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/legal/terms")({
  component: () => (
    <PageContainer size="narrow">
      <SectionHeader title="Terms of Service" description="Conditions of use for Digital Invest Compass." />
      <EmptyState
        icon={FileText}
        title="Terms not published yet"
        description="The terms of service will appear here once finalised by Legal."
      />
    </PageContainer>
  ),
});