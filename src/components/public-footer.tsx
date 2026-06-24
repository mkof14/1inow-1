import { Link } from "@tanstack/react-router";
import { Github, Linkedin, Mail, Send, Youtube } from "lucide-react";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";

const footerCopy = {
  en: {
    description:
      "A personal command center for projects, life tasks, voice capture, decisions, and controlled intelligence.",
    contact: "Contact 1inow",
    email: "Email",
    message: "Message",
    send: "Send",
    signIn: "Sign in",
    copyright: "All rights reserved.",
    groups: [
      {
        title: "Learning",
        links: [
          ["Voice capture", "voice-capture"],
          ["Review queue", "review-queue"],
          ["Next action", "next-action"],
          ["Risk tracking", "risk-tracking"],
        ],
      },
      {
        title: "Product",
        links: [
          ["How it works", "how-it-works-page"],
          ["Nova + Vera", "nova-vera"],
          ["Device connections", "device-connections-page"],
          ["Intelligence layer", "intelligence-layer"],
          ["Operating picture", "operating-picture"],
          ["Projects", "projects"],
          ["Automation", "automation-readiness"],
        ],
      },
      {
        title: "Company",
        links: [
          ["FAQ", "faq"],
          ["Legal", "legal"],
          ["Privacy Policy", "privacy-policy"],
          ["Terms of Use", "terms-of-use"],
          ["Security & Trust", "security-trust-page"],
          ["Principles", "principles"],
        ],
      },
      {
        title: "Site map",
        links: [
          ["Roadmap", "roadmap-page"],
          ["Security", "security"],
          ["Contact", "contact"],
          ["Open workspace", "auth"],
        ],
      },
    ],
  },
  ru: {
    description:
      "Персональный командный центр для проектов, жизненных задач, голосовых записей, решений и контролируемого интеллекта.",
    contact: "Связаться с 1inow",
    email: "Email",
    message: "Сообщение",
    send: "Отправить",
    signIn: "Войти",
    copyright: "Все права защищены.",
    groups: [
      {
        title: "Обучение",
        links: [
          ["Голосовой ввод", "voice-capture"],
          ["Разбор очереди", "review-queue"],
          ["Следующее действие", "next-action"],
          ["Контроль рисков", "risk-tracking"],
        ],
      },
      {
        title: "Продукт",
        links: [
          ["Как это работает", "how-it-works-page"],
          ["Nova + Vera", "nova-vera"],
          ["Подключение устройств", "device-connections-page"],
          ["Интеллектуальный слой", "intelligence-layer"],
          ["Картина дня", "operating-picture"],
          ["Проекты", "projects"],
          ["Автоматизация", "automation-readiness"],
        ],
      },
      {
        title: "Компания",
        links: [
          ["FAQ", "faq"],
          ["Legal", "legal"],
          ["Политика конфиденциальности", "privacy-policy"],
          ["Условия использования", "terms-of-use"],
          ["Безопасность и доверие", "security-trust-page"],
          ["Принципы", "principles"],
        ],
      },
      {
        title: "Карта сайта",
        links: [
          ["Roadmap", "roadmap-page"],
          ["Безопасность", "security"],
          ["Контакт", "contact"],
          ["Открыть систему", "auth"],
        ],
      },
    ],
  },
  uk: {
    description:
      "Персональний командний центр для проєктів, життєвих задач, голосових записів, рішень і контрольованого інтелекту.",
    contact: "Зв'язатися з 1inow",
    email: "Email",
    message: "Повідомлення",
    send: "Надіслати",
    signIn: "Увійти",
    copyright: "Усі права захищені.",
    groups: [
      {
        title: "Навчання",
        links: [
          ["Голосовий ввід", "voice-capture"],
          ["Перегляд черги", "review-queue"],
          ["Наступна дія", "next-action"],
          ["Контроль ризиків", "risk-tracking"],
        ],
      },
      {
        title: "Продукт",
        links: [
          ["Як це працює", "how-it-works-page"],
          ["Nova + Vera", "nova-vera"],
          ["Підключення пристроїв", "device-connections-page"],
          ["Інтелектуальний шар", "intelligence-layer"],
          ["Картина дня", "operating-picture"],
          ["Проєкти", "projects"],
          ["Автоматизація", "automation-readiness"],
        ],
      },
      {
        title: "Компанія",
        links: [
          ["FAQ", "faq"],
          ["Legal", "legal"],
          ["Політика конфіденційності", "privacy-policy"],
          ["Умови використання", "terms-of-use"],
          ["Безпека і довіра", "security-trust-page"],
          ["Принципи", "principles"],
        ],
      },
      {
        title: "Карта сайту",
        links: [
          ["Roadmap", "roadmap-page"],
          ["Безпека", "security"],
          ["Контакт", "contact"],
          ["Відкрити систему", "auth"],
        ],
      },
    ],
  },
  es: {
    description:
      "Centro de mando personal para proyectos, tareas de vida, voz, decisiones e inteligencia controlada.",
    contact: "Contactar 1inow",
    email: "Email",
    message: "Mensaje",
    send: "Enviar",
    signIn: "Entrar",
    copyright: "Todos los derechos reservados.",
    groups: [
      {
        title: "Aprendizaje",
        links: [
          ["Captura por voz", "voice-capture"],
          ["Revisar cola", "review-queue"],
          ["Siguiente acción", "next-action"],
          ["Riesgos", "risk-tracking"],
        ],
      },
      {
        title: "Producto",
        links: [
          ["Cómo funciona", "how-it-works-page"],
          ["Nova + Vera", "nova-vera"],
          ["Conexión de dispositivos", "device-connections-page"],
          ["Capa inteligente", "intelligence-layer"],
          ["Vista operativa", "operating-picture"],
          ["Proyectos", "projects"],
          ["Automatización", "automation-readiness"],
        ],
      },
      {
        title: "Compañía",
        links: [
          ["FAQ", "faq"],
          ["Legal", "legal"],
          ["Política de privacidad", "privacy-policy"],
          ["Términos de uso", "terms-of-use"],
          ["Seguridad y confianza", "security-trust-page"],
          ["Principios", "principles"],
        ],
      },
      {
        title: "Mapa del sitio",
        links: [
          ["Roadmap", "roadmap-page"],
          ["Seguridad", "security"],
          ["Contacto", "contact"],
          ["Abrir espacio", "auth"],
        ],
      },
    ],
  },
  de: {
    description:
      "Persönliches Command Center für Projekte, Lebensaufgaben, Voice Capture, Entscheidungen und kontrollierte Intelligenz.",
    contact: "1inow kontaktieren",
    email: "Email",
    message: "Nachricht",
    send: "Senden",
    signIn: "Anmelden",
    copyright: "Alle Rechte vorbehalten.",
    groups: [
      {
        title: "Lernen",
        links: [
          ["Voice Capture", "voice-capture"],
          ["Queue prüfen", "review-queue"],
          ["Nächste Aktion", "next-action"],
          ["Risiken", "risk-tracking"],
        ],
      },
      {
        title: "Produkt",
        links: [
          ["Wie es funktioniert", "how-it-works-page"],
          ["Nova + Vera", "nova-vera"],
          ["Geräte verbinden", "device-connections-page"],
          ["Intelligenzschicht", "intelligence-layer"],
          ["Tagesbild", "operating-picture"],
          ["Projekte", "projects"],
          ["Automatisierung", "automation-readiness"],
        ],
      },
      {
        title: "Unternehmen",
        links: [
          ["FAQ", "faq"],
          ["Legal", "legal"],
          ["Datenschutzerklärung", "privacy-policy"],
          ["Nutzungsbedingungen", "terms-of-use"],
          ["Security & Trust", "security-trust-page"],
          ["Prinzipien", "principles"],
        ],
      },
      {
        title: "Sitemap",
        links: [
          ["Roadmap", "roadmap-page"],
          ["Sicherheit", "security"],
          ["Kontakt", "contact"],
          ["Workspace öffnen", "auth"],
        ],
      },
    ],
  },
};

const socials = [
  ["X", "https://x.com", null],
  ["LinkedIn", "https://www.linkedin.com", Linkedin],
  ["GitHub", "https://github.com", Github],
  ["YouTube", "https://www.youtube.com", Youtube],
] as const;

export function PublicFooter() {
  const { lang } = useI18n();
  const copy = footerCopy[lang as keyof typeof footerCopy] ?? footerCopy.en;

  return (
    <footer className="relative overflow-hidden border-t border-slate-900/8 bg-[linear-gradient(135deg,#edf7f4_0%,#f8fbff_46%,#fff7e4_100%)] px-5 py-8 text-sm text-slate-600 dark:border-white/10 dark:bg-[linear-gradient(135deg,#071216_0%,#0d1e27_48%,#17140b_100%)] dark:text-white/58 md:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal-400 via-sky-400 to-amber-300" />
      <div className="absolute -right-20 -top-20 size-56 rounded-full bg-teal-300/18 blur-3xl dark:bg-teal-300/10" />
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.82fr_0.9fr_0.95fr_0.82fr_1.18fr]">
        <div>
          <BrandWordmark size={30} />
          <p className="mt-3 max-w-sm text-sm leading-6">{copy.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle
              showLabel
              className="rounded-xl border border-slate-900/8 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            {socials.map(([label, href, Icon]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-9 place-items-center rounded-xl border border-slate-900/8 bg-white/70 text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-slate-950 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:text-white/58 dark:hover:text-white"
              >
                {Icon ? <Icon className="size-4" /> : <span className="text-sm font-black">X</span>}
              </a>
            ))}
          </div>
        </div>

        {copy.groups.map((group) => (
          <FooterColumn key={group.title} title={group.title} links={group.links} />
        ))}

        <div className="relative overflow-hidden rounded-2xl border border-slate-900/8 bg-white/72 p-4 shadow-xl shadow-slate-950/6 dark:border-white/10 dark:bg-white/[0.055]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-sky-400 to-amber-300" />
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
            <Mail className="size-4 text-teal-600 dark:text-teal-200" />
            {copy.contact}
          </div>
          <form
            action="mailto:dnainform@gmail.com"
            method="post"
            encType="text/plain"
            className="space-y-2"
          >
            <input
              name="email"
              type="email"
              placeholder={copy.email}
              className="h-9 w-full rounded-xl border border-slate-900/10 bg-white/80 px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-teal-400 dark:border-white/10 dark:bg-white/[0.06] dark:placeholder:text-white/35"
            />
            <textarea
              name="message"
              placeholder={copy.message}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-900/10 bg-white/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-teal-400 dark:border-white/10 dark:bg-white/[0.06] dark:placeholder:text-white/35"
            />
            <button
              type="submit"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
            >
              {copy.send}
              <Send className="size-3.5" />
            </button>
          </form>
          <a
            href="/auth"
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-900/10 bg-white/70 text-sm font-semibold text-slate-800 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
          >
            {copy.signIn}
          </a>
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-2 border-t border-slate-900/8 pt-5 text-xs text-slate-500 dark:border-white/10 dark:text-white/42 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Copyright © {new Date().getFullYear()} 1inow Inc. {copy.copyright}
        </span>
        <span>1inow.com</span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<string[]> }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/42">
        {title}
      </h2>
      <div className="space-y-2">
        {links.map(([label, slug]) =>
          slug === "principles" ? (
            <Link
              key={slug}
              to="/principles/strategic-vs-tactical"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ) : slug === "how-it-works-page" ? (
            <Link
              key={slug}
              to="/how-it-works"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ) : slug === "security-trust-page" ? (
            <Link
              key={slug}
              to="/security-trust"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ) : slug === "roadmap-page" ? (
            <Link
              key={slug}
              to="/roadmap"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ) : slug === "device-connections-page" ? (
            <Link
              key={slug}
              to="/device-connections"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ) : slug === "privacy-policy" ? (
            <Link
              key={slug}
              to="/legal/privacy"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ) : slug === "terms-of-use" ? (
            <Link
              key={slug}
              to="/legal/terms"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ) : slug === "auth" ? (
            <a key={slug} href="/auth" className="block hover:text-slate-950 dark:hover:text-white">
              {label}
            </a>
          ) : slug === "nova-vera" ? (
            <a
              key={slug}
              href="/#nova-vera"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </a>
          ) : slug === "contact" ? (
            <a
              key={slug}
              href="mailto:dnainform@gmail.com"
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </a>
          ) : (
            <Link
              key={slug}
              to="/learn/$slug"
              params={{ slug }}
              className="block hover:text-slate-950 dark:hover:text-white"
            >
              {label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
