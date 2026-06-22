import { Link } from "@tanstack/react-router";
import { Github, Linkedin, Mail, Send, Twitter, Youtube } from "lucide-react";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

const footerGroups = [
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
      ["Security", "security"],
      ["Principles", "principles"],
    ],
  },
];

const socials = [
  ["X", "https://x.com", Twitter],
  ["LinkedIn", "https://www.linkedin.com", Linkedin],
  ["GitHub", "https://github.com", Github],
  ["YouTube", "https://www.youtube.com", Youtube],
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-900/8 bg-[#edf7f4] px-5 py-8 text-sm text-slate-600 dark:border-white/10 dark:bg-[#0b171b] dark:text-white/58 md:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.25fr]">
        <div>
          <BrandWordmark size={30} />
          <p className="mt-3 max-w-sm text-sm leading-6">
            A personal command center for projects, life tasks, voice capture, decisions, and future
            AI assistance.
          </p>
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
                className="grid size-9 place-items-center rounded-xl border border-slate-900/8 bg-white/60 text-slate-600 transition-colors hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/58 dark:hover:text-white"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {footerGroups.map((group) => (
          <FooterColumn key={group.title} title={group.title} links={group.links} />
        ))}

        <div className="rounded-2xl border border-slate-900/8 bg-white/62 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
            <Mail className="size-4 text-teal-600 dark:text-teal-200" />
            Contact 1inow
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
              placeholder="Email"
              className="h-9 w-full rounded-xl border border-slate-900/10 bg-white/80 px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-teal-400 dark:border-white/10 dark:bg-white/[0.06] dark:placeholder:text-white/35"
            />
            <textarea
              name="message"
              placeholder="Message"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-900/10 bg-white/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-teal-400 dark:border-white/10 dark:bg-white/[0.06] dark:placeholder:text-white/35"
            />
            <button
              type="submit"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
            >
              Send
              <Send className="size-3.5" />
            </button>
          </form>
          <Link
            to="/auth"
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-900/10 bg-white/70 text-sm font-semibold text-slate-800 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-2 border-t border-slate-900/8 pt-5 text-xs text-slate-500 dark:border-white/10 dark:text-white/42 sm:flex-row sm:items-center sm:justify-between">
        <span>Copyright © {new Date().getFullYear()} 1inow Inc. All rights reserved.</span>
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
