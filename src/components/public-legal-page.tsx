import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PublicAssistantPersonas } from "@/components/public-assistant-personas";
import { PublicFooter } from "@/components/public-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";
import type { LegalPack } from "@/lib/public-legal";

const legalUiCopy = {
  en: {
    home: "Home",
    signIn: "Sign in",
    system: "command system",
    status: "Public legal base",
    related: "Related pages",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    legal: "Legal overview",
  },
  ru: {
    home: "Главная",
    signIn: "Войти",
    system: "командная система",
    status: "Публичная legal-база",
    related: "Связанные страницы",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    legal: "Legal обзор",
  },
  uk: {
    home: "Головна",
    signIn: "Увійти",
    system: "командна система",
    status: "Публічна legal-база",
    related: "Пов'язані сторінки",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    legal: "Legal огляд",
  },
  es: {
    home: "Inicio",
    signIn: "Entrar",
    system: "sistema de mando",
    status: "Base legal pública",
    related: "Páginas relacionadas",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    legal: "Resumen legal",
  },
  de: {
    home: "Home",
    signIn: "Anmelden",
    system: "Command System",
    status: "Öffentliche Legal-Basis",
    related: "Verwandte Seiten",
    privacy: "Datenschutzerklärung",
    terms: "Nutzungsbedingungen",
    legal: "Legal Überblick",
  },
};

export function PublicLegalPage({
  content,
  kind,
}: {
  content: LegalPack;
  kind: "privacy" | "terms";
}) {
  const { lang } = useI18n();
  const ui = legalUiCopy[lang as keyof typeof legalUiCopy] ?? legalUiCopy.en;
  const Icon = kind === "privacy" ? ShieldCheck : FileText;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-slate-950 dark:bg-[#061014] dark:text-white">
      <section className="relative bg-[linear-gradient(135deg,#f7faf8_0%,#e8fff6_36%,#eaf4ff_72%,#fff7e7_100%)] dark:bg-[linear-gradient(135deg,#061014_0%,#0d2830_42%,#10203b_76%,#211a0f_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(59,130,246,0.18),transparent_28%)]" />
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex flex-col leading-none">
              <BrandWordmark size={34} />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">
                {ui.system}
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
              {ui.signIn}
              <ArrowRight className="hidden size-3.5 sm:block" />
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-5 pb-14 pt-8 md:px-8 md:pb-20 md:pt-14 lg:grid-cols-[0.92fr_0.48fr] lg:items-end">
          <div>
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-white/62 dark:hover:text-white"
            >
              <ArrowLeft className="size-4" />
              {ui.home}
            </Link>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/62 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-white/70">
              <Icon className="size-3.5 text-teal-600 dark:text-teal-200" />
              {content.eyebrow}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-white/70 md:text-xl">
              {content.subtitle}
            </p>
          </div>

          <aside className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/72 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-sky-400 to-amber-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
              {ui.status}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/68">
              {content.notice}
            </p>
            <p className="mt-5 rounded-2xl border border-slate-900/8 bg-white/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/48">
              {content.updated}
            </p>
          </aside>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.72fr_0.28fr]">
          <article className="space-y-5">
            {content.sections.map((section) => (
              <section
                key={section.h}
                className="relative overflow-hidden rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8 dark:border-white/10 dark:bg-white/[0.055]"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-teal-400 via-sky-400 to-amber-300 opacity-70" />
                <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {section.h}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/64">
                  {section.p}
                </p>
              </section>
            ))}
          </article>

          <aside className="h-fit rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              {ui.related}
            </h2>
            <div className="mt-4 space-y-2">
              <LegalLink to="/learn/legal" label={ui.legal} />
              <LegalLink to="/legal/privacy" label={ui.privacy} />
              <LegalLink to="/legal/terms" label={ui.terms} />
            </div>
          </aside>
        </div>
      </section>

      <PublicAssistantPersonas />

      <PublicFooter />
    </main>
  );
}

function LegalLink({
  to,
  label,
}: {
  to: "/learn/legal" | "/legal/privacy" | "/legal/terms";
  label: string;
}) {
  if (to === "/learn/legal") {
    return (
      <Link
        to="/learn/$slug"
        params={{ slug: "legal" }}
        className="flex items-center justify-between rounded-2xl border border-slate-900/8 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/72 dark:hover:text-white"
      >
        {label}
        <ArrowRight className="size-4" />
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl border border-slate-900/8 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/72 dark:hover:text-white"
    >
      {label}
      <ArrowRight className="size-4" />
    </Link>
  );
}
