import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, SectionHeader, ResponsiveGrid } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { simplicityRules, forbiddenJargon } from "@/lib/simplicity";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/simplicity")({
  component: SimplicityPage,
});

function SimplicityPage() {
  const t = useT();
  return (
    <PageContainer size="wide">
      <SectionHeader
        title={t("page.simplicity.title")}
        description={t("page.simplicity.subtitle")}
      />

      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="py-5">
          <p className="text-sm font-medium">
            Top rule: a new user understands the product within one minute — without videos,
            tutorials, or documentation.
          </p>
        </CardContent>
      </Card>

      <ResponsiveGrid min={280} className="mb-8">
        {simplicityRules.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{r.rule}</p>
            </CardContent>
          </Card>
        ))}
      </ResponsiveGrid>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Words the user never sees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {forbiddenJargon.map((w) => (
              <span
                key={w}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {w}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The user sees only: Projects, People, Files, Messages, Assistant.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
