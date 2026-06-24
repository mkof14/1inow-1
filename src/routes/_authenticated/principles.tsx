import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, SectionHeader, ResponsiveGrid } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { productPrinciples, featureReviewChecklist, assistantBehavior } from "@/lib/principles";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/principles")({
  component: PrinciplesPage,
});

function PrinciplesPage() {
  const t = useT();
  return (
    <PageContainer size="wide">
      <SectionHeader
        title={t("page.principles.title")}
        description={t("page.principles.subtitle")}
      />

      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="py-5">
          <p className="text-sm font-medium">
            Top rule: do not ask the user to do what the system can understand, infer, connect, or
            prepare by itself.
          </p>
        </CardContent>
      </Card>

      <ResponsiveGrid min={280} className="mb-8">
        {productPrinciples.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.rule}</p>
            </CardContent>
          </Card>
        ))}
      </ResponsiveGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Review Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {featureReviewChecklist.map((q) => (
                <li key={q} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              If any answer is "no", redesign or drop the feature.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assistant Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Tone</div>
              <div className="flex flex-wrap gap-1.5">
                {assistantBehavior.tone.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Avoid
              </div>
              <div className="flex flex-wrap gap-1.5">
                {assistantBehavior.avoid.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Must say when true
              </div>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {assistantBehavior.mustSayWhenTrue.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Never invent
              </div>
              <p className="text-muted-foreground">{assistantBehavior.neverInvent.join(", ")}.</p>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Notify only when
              </div>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {assistantBehavior.notifyOnly.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
