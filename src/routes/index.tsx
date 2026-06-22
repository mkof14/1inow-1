import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Inbox,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "@/components/icons/compass-mark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "1inow - Personal Command Center" },
      {
        name: "description",
        content:
          "1inow turns scattered projects, tasks, voice notes, decisions, and daily signals into one practical command center.",
      },
      { property: "og:title", content: "1inow - Personal Command Center" },
      {
        property: "og:description",
        content:
          "A practical command center for projects, tasks, voice capture, decisions, and daily execution.",
      },
      { property: "og:url", content: "https://1inow.com/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://1inow.com/icons/icon-512.png" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "1inow - Personal Command Center" },
      {
        name: "twitter:description",
        content: "Projects, tasks, voice capture, decisions, and daily execution in one workspace.",
      },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/" }],
  }),
  component: LandingPage,
});

const operatingSignals = [
  "Capture by voice",
  "Review the queue",
  "Create tasks and projects",
  "Track risks and decisions",
];

const modules = [
  {
    icon: Mic,
    title: "Voice capture",
    text: "Speak or type a thought. Save it to Voice Inbox. Process it when ready.",
  },
  {
    icon: Inbox,
    title: "Review queue",
    text: "Turn raw ideas into tasks, projects, reminders, notes, or risk signals.",
  },
  {
    icon: FolderKanban,
    title: "Execution system",
    text: "Keep projects, tasks, deadlines, and daily focus in one operational view.",
  },
  {
    icon: ShieldCheck,
    title: "Controlled AI path",
    text: "AI, STT, and TTS stay disabled until explicit production approval.",
  },
];

function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BrandMark className="size-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">1inow</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/principles/strategic-vs-tactical"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Principles
          </Link>
          <Link
            to="/auth"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-accent/40"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-10 md:px-8 md:pb-20 md:pt-16">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            Private command center for real daily work
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            1inow turns scattered work and life tasks into a usable command system.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Capture what matters, review it without friction, create the next action, and keep
            projects moving without turning the product into another task calculator.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open workspace
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/principles/strategic-vs-tactical"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-accent/40"
            >
              Read principles
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-[0_24px_80px_-48px_color-mix(in_oklab,var(--foreground)_45%,transparent)] md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="" className="size-9 rounded-xl" />
              <div>
                <div className="text-sm font-semibold">Today command view</div>
                <div className="text-xs text-muted-foreground">Voice, projects, tasks, risks</div>
              </div>
            </div>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-muted-foreground">
              live
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {operatingSignals.map((signal, index) => (
                <div
                  key={signal}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/70 p-3"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{signal}</span>
                  <CheckCircle2 className="size-4 shrink-0 text-accent" />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-accent" />
                Daily operating picture
              </div>
              <div className="space-y-3">
                <Metric label="Voice captures" value="5" />
                <Metric label="Open tasks" value="14" />
                <Metric label="Risks" value="2" />
              </div>
              <div className="mt-4 rounded-xl border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
                Review captured thoughts, choose the next action, keep control before any automation
                runs.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-14 md:grid-cols-4 md:px-8">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="mb-4 grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="size-4" />
                </div>
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Built for controlled execution.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with capture and review. Add external AI only after the workflow is stable.
          </p>
        </div>
        <Link
          to="/auth"
          className="inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Continue to app
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="size-3.5 text-accent" />
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
