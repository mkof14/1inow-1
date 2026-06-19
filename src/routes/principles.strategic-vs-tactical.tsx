import { createFileRoute, Link } from "@tanstack/react-router";

const CANONICAL = "https://investspace-hub.lovable.app/principles/strategic-vs-tactical";

export const Route = createFileRoute("/principles/strategic-vs-tactical")({
  head: () => ({
    meta: [
      { title: "Strategic vs Tactical Planning for Investment Teams — 1inow" },
      {
        name: "description",
        content:
          "A practical guide for investment teams on the difference between strategic and tactical planning — horizons, decisions, owners, cadence, and how 1inow operationalizes both.",
      },
      { property: "og:title", content: "Strategic vs Tactical Planning for Investment Teams" },
      {
        property: "og:description",
        content:
          "Horizons, decisions, owners, and cadence — how strategic and tactical planning differ and how to run them in one workspace.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Strategic vs Tactical Planning for Investment Teams" },
      {
        name: "twitter:description",
        content:
          "Horizons, decisions, owners, and cadence — how strategic and tactical planning differ.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Strategic vs Tactical Planning for Investment Teams",
          description:
            "A practical guide on the difference between strategic and tactical planning in investment teams.",
          mainEntityOfPage: CANONICAL,
          author: { "@type": "Organization", name: "1inow" },
          publisher: {
            "@type": "Organization",
            name: "1inow",
            logo: {
              "@type": "ImageObject",
              url: "https://investspace-hub.lovable.app/icons/icon-512.png",
            },
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://investspace-hub.lovable.app/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Principles",
              item: "https://investspace-hub.lovable.app/principles",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Strategic vs Tactical",
              item: CANONICAL,
            },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is the difference between strategic and tactical planning?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Strategic planning sets multi-year direction — thesis, allocation, capabilities. Tactical planning translates that direction into quarterly and weekly moves — sourcing, sizing, follow-ons, and operating decisions.",
              },
            },
            {
              "@type": "Question",
              name: "Who owns each layer in an investment team?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Partners own the strategic layer (thesis, mandate, allocation). Investment leads and operators own the tactical layer (pipeline, diligence, portfolio actions).",
              },
            },
            {
              "@type": "Question",
              name: "How often should each be reviewed?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Strategy is reviewed annually with a mid-year checkpoint. Tactics are reviewed weekly in the IC and monthly at the portfolio level.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: StrategicVsTacticalPage,
});

function StrategicVsTacticalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span>Principles</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Strategic vs Tactical</span>
        </nav>

        <header className="mb-12">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Principles
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Strategic vs Tactical Planning for Investment Teams
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Two planning layers, one operating system. How to separate long-horizon direction
            from short-horizon execution — and keep them connected.
          </p>
        </header>

        <section className="prose prose-invert max-w-none">
          <h2 className="mt-12 text-2xl font-semibold">The two layers, side by side</h2>
          <div className="my-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Dimension</th>
                  <th className="px-4 py-3 text-left font-medium">Strategic</th>
                  <th className="px-4 py-3 text-left font-medium">Tactical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Horizon", "3–10 years", "1 week – 4 quarters"],
                  ["Question", "Where do we play and why?", "What do we do this quarter?"],
                  ["Owner", "Partners / IC", "Deal leads, operators"],
                  ["Cadence", "Annual + mid-year", "Weekly IC, monthly portfolio"],
                  ["Output", "Thesis, mandate, allocation", "Pipeline, sizing, follow-ons"],
                  ["Risk frame", "Regime, structural", "Position, execution"],
                ].map(([dim, s, t]) => (
                  <tr key={dim}>
                    <td className="px-4 py-3 font-medium">{dim}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-12 text-2xl font-semibold">Why teams confuse the two</h2>
          <p className="mt-4 text-muted-foreground">
            Most investment teams over-index on tactics. Weekly IC meetings fill the calendar,
            deal memos accumulate, and the strategic layer becomes an offsite deck nobody opens
            again until next year. The reverse failure mode is rarer but just as costly:
            beautiful strategy that never translates into a sized position or a hired operator.
          </p>

          <h2 className="mt-12 text-2xl font-semibold">A working definition</h2>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">Strategic</strong> decisions change what you
              are — mandate, geography, stage, check size, team shape.
            </li>
            <li>
              <strong className="text-foreground">Tactical</strong> decisions change what you
              do this week — which call to take, which check to write, which portfolio
              company gets the next hour.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold">Connecting the layers</h2>
          <p className="mt-4 text-muted-foreground">
            Every tactical decision should be traceable to a strategic commitment, and every
            strategic commitment should be observable in the tactical record. If your thesis
            says "infrastructure for AI-native back offices," your last 20 first meetings
            should reflect it. If they don't, one of the two layers is lying.
          </p>

          <h2 className="mt-12 text-2xl font-semibold">How 1inow operationalizes both</h2>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">Signals & thesis</strong> capture strategic
              direction as living documents, not slides.
            </li>
            <li>
              <strong className="text-foreground">Decisions</strong> log every tactical move
              with a link back to the thesis it serves.
            </li>
            <li>
              <strong className="text-foreground">Portfolio & people</strong> surface where
              execution is drifting from strategy before the next review.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold">FAQ</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="font-medium text-foreground">
                What is the difference between strategic and tactical planning?
              </dt>
              <dd className="mt-2 text-muted-foreground">
                Strategic planning sets multi-year direction — thesis, allocation, capabilities.
                Tactical planning translates that direction into quarterly and weekly moves.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Who owns each layer?</dt>
              <dd className="mt-2 text-muted-foreground">
                Partners own strategy. Deal leads and operators own tactics.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">How often should each be reviewed?</dt>
              <dd className="mt-2 text-muted-foreground">
                Strategy annually with a mid-year checkpoint; tactics weekly in IC and monthly
                at the portfolio level.
              </dd>
            </div>
          </dl>
        </section>

        <footer className="mt-16 border-t border-border pt-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            ← Back to home
          </Link>
        </footer>
      </article>
    </main>
  );
}