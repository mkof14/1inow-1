import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PublicFooter } from "@/components/public-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicLearningTopic, publicLearningTopics } from "@/lib/public-learning";

export const Route = createFileRoute("/learn/$slug")({
  loader: ({ params }) => {
    const topic = getPublicLearningTopic(params.slug);
    if (!topic) throw notFound();
    return topic;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData.title} - 1inow Learning` },
      { name: "description", content: loaderData.summary },
      { property: "og:title", content: `${loaderData.title} - 1inow` },
      { property: "og:description", content: loaderData.summary },
      { property: "og:type", content: "article" },
      { property: "og:image", content: `https://1inow.com${loaderData.image}` },
    ],
    links: [{ rel: "canonical", href: `https://1inow.com/learn/${loaderData.slug}` }],
  }),
  component: LearningPage,
});

function LearningPage() {
  const topic = Route.useLoaderData();
  const Icon = topic.icon;
  const related = publicLearningTopics.filter((item) => item.slug !== topic.slug).slice(0, 4);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-slate-950 dark:bg-[#061014] dark:text-white">
      <section className="relative bg-[linear-gradient(135deg,#f7faf8_0%,#e8fff6_36%,#eaf4ff_72%,#fff7e7_100%)] dark:bg-[linear-gradient(135deg,#061014_0%,#0d2830_42%,#10203b_76%,#211a0f_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(59,130,246,0.18),transparent_28%)]" />
        <PublicHeader />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-5 pb-14 pt-8 md:px-8 md:pb-20 md:pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-white/62 dark:hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/62 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-white/70">
              <Icon className="size-3.5 text-teal-600 dark:text-teal-200" />
              {topic.eyebrow}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl">
              {topic.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-white/70 md:text-xl">
              {topic.summary}
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-3 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <img src={topic.image} alt="" className="h-80 w-full rounded-[1.4rem] object-cover" />
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.78fr_0.22fr]">
          <article className="space-y-5">
            {topic.sections.map(([title, text]) => (
              <section
                key={title}
                className="rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
              >
                <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/64">{text}</p>
              </section>
            ))}
          </article>

          <aside className="h-fit rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              Key ideas
            </h2>
            <div className="mt-4 space-y-3">
              {topic.takeaways.map((takeaway) => (
                <div
                  key={takeaway}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-teal-500" />
                  {takeaway}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">Related learning</h2>
          <div className="grid gap-3 md:grid-cols-4">
            {related.map((item) => {
              const RelatedIcon = item.icon;
              return (
                <Link
                  key={item.slug}
                  to="/learn/$slug"
                  params={{ slug: item.slug }}
                  className="rounded-2xl border border-slate-900/8 bg-white/72 p-4 text-sm font-medium text-slate-800 transition-transform hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.055] dark:text-white/78"
                >
                  <RelatedIcon className="mb-3 size-4 text-teal-600 dark:text-teal-200" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
      <Link to="/" className="flex items-center gap-3">
        <span className="flex flex-col leading-none">
          <BrandWordmark size={34} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">
            command system
          </span>
        </span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2">
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <div className="sm:hidden">
          <LanguageSwitcher compact />
        </div>
        <ThemeToggle className="rounded-xl bg-white/55 shadow-sm ring-1 ring-slate-900/5 backdrop-blur dark:bg-white/8 dark:ring-white/10" />
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950 sm:px-4"
        >
          Sign in
          <ArrowRight className="hidden size-3.5 sm:block" />
        </Link>
      </nav>
    </header>
  );
}
