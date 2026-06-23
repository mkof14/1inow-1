import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PublicAssistantPersonas } from "@/components/public-assistant-personas";
import { PublicFooter } from "@/components/public-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";
import { getPublicLearningTopic, getPublicLearningTopics } from "@/lib/public-learning";

const learnUiCopy = {
  en: {
    back: "Back to Home",
    signIn: "Sign in",
    system: "command system",
    keyIdeas: "Key ideas",
    related: "Related learning",
    signal: "Public guide",
  },
  ru: {
    back: "На главную",
    signIn: "Войти",
    system: "командная система",
    keyIdeas: "Ключевые идеи",
    related: "Связанные материалы",
    signal: "Публичный гид",
  },
  uk: {
    back: "На головну",
    signIn: "Увійти",
    system: "командна система",
    keyIdeas: "Ключові ідеї",
    related: "Пов'язані матеріали",
    signal: "Публічний гід",
  },
  es: {
    back: "Volver al inicio",
    signIn: "Entrar",
    system: "sistema de mando",
    keyIdeas: "Ideas clave",
    related: "Aprendizaje relacionado",
    signal: "Guía pública",
  },
  de: {
    back: "Zur Startseite",
    signIn: "Anmelden",
    system: "Command System",
    keyIdeas: "Kernideen",
    related: "Weitere Inhalte",
    signal: "Public Guide",
  },
};

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
  const baseTopic = Route.useLoaderData();
  const { lang } = useI18n();
  const ui = learnUiCopy[lang as keyof typeof learnUiCopy] ?? learnUiCopy.en;
  const topic = getPublicLearningTopic(baseTopic.slug, lang) ?? baseTopic;
  const Icon = topic.icon;
  const related = getPublicLearningTopics(lang)
    .filter((item) => item.slug !== topic.slug)
    .slice(0, 4);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-slate-950 dark:bg-[#061014] dark:text-white">
      <section className="relative bg-[linear-gradient(135deg,#f7faf8_0%,#e8fff6_36%,#eaf4ff_72%,#fff7e7_100%)] dark:bg-[linear-gradient(135deg,#061014_0%,#0d2830_42%,#10203b_76%,#211a0f_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(59,130,246,0.18),transparent_28%)]" />
        <PublicHeader copy={ui} />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-5 pb-14 pt-8 md:px-8 md:pb-20 md:pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-white/62 dark:hover:text-white"
            >
              <ArrowLeft className="size-4" />
              {ui.back}
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

          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-3 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <img src={topic.image} alt="" className="h-80 w-full rounded-[1.4rem] object-cover" />
            <div className="absolute inset-x-8 bottom-8 rounded-3xl border border-white/72 bg-white/80 p-4 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/62">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/48">
                    {ui.signal}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                    {topic.takeaways[0]}
                  </p>
                </div>
                <div className="grid size-11 place-items-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25">
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.78fr_0.22fr]">
          <article className="space-y-5">
            {topic.sections.map(([title, text]) => (
              <section
                key={title}
                className="group relative overflow-hidden rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8 dark:border-white/10 dark:bg-white/[0.055]"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-teal-400 via-sky-400 to-amber-300 opacity-70" />
                <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/64">{text}</p>
              </section>
            ))}
          </article>

          <aside className="h-fit rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              {ui.keyIdeas}
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
          <h2 className="mb-4 text-xl font-semibold tracking-tight">{ui.related}</h2>
          <div className="grid gap-3 md:grid-cols-4">
            {related.map((item) => {
              const RelatedIcon = item.icon;
              return (
                <Link
                  key={item.slug}
                  to="/learn/$slug"
                  params={{ slug: item.slug }}
                  className="rounded-2xl border border-slate-900/8 bg-white/72 p-4 text-sm font-medium text-slate-800 transition-transform hover:-translate-y-0.5 hover:border-teal-300/60 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.055] dark:text-white/78"
                >
                  <RelatedIcon className="mb-3 size-4 text-teal-600 dark:text-teal-200" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <PublicAssistantPersonas />

      <PublicFooter />
    </main>
  );
}

function PublicHeader({ copy }: { copy: (typeof learnUiCopy)["en"] }) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
      <Link to="/" className="flex items-center gap-3">
        <span className="flex flex-col leading-none">
          <BrandWordmark size={34} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">
            {copy.system}
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
          {copy.signIn}
          <ArrowRight className="hidden size-3.5 sm:block" />
        </Link>
      </nav>
    </header>
  );
}
