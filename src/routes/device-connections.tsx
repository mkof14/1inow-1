import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Cable,
  CheckCircle2,
  FileAudio,
  Headphones,
  ListChecks,
  Mic,
  ShieldCheck,
  UploadCloud,
  Watch,
} from "lucide-react";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PublicAssistantPersonas } from "@/components/public-assistant-personas";
import { PublicFooter } from "@/components/public-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/device-connections")({
  head: () => ({
    meta: [
      { title: "Device Connections - 1inow" },
      {
        name: "description",
        content:
          "How 1inow will import conversations, calls, meetings, and voice recorder files from compatible recorders and meeting capture tools.",
      },
      { property: "og:title", content: "1inow Device Connections" },
      {
        property: "og:description",
        content:
          "Bring conversations, phone calls, meetings, and voice recorder files into a useful project and life command system.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/device-connections" }],
  }),
  component: DeviceConnectionsPage,
});

const copy = {
  en: {
    home: "Home",
    signIn: "Sign in",
    system: "command system",
    eyebrow: "Conversation intake layer",
    title: "Upload conversations. Turn them into useful memory, decisions, and next actions.",
    subtitle:
      "Bring meeting recordings, calls, voice recorder files, transcripts, and notes into one review flow.",
    cta: "Open workspace",
    uploadTitle: "Conversation intake",
    uploadText:
      "Upload audio, video, transcripts, or meeting notes, then review summaries, decisions, risks, and project actions before anything is committed.",
    safe: "Processing stays controlled and review-first.",
    flow: ["Record", "Upload", "Review", "Extract", "Act"],
    devicesTitle: "First practical device targets",
    devicesText:
      "Start with devices and tools that export recordings or transcripts. Direct integrations should stay scoped, auditable, and approved.",
    outcomesTitle: "What the system can create from a conversation",
    outcomes: ["Summary", "Next actions", "Risks", "Project updates"],
  },
  ru: {
    home: "Главная",
    signIn: "Войти",
    system: "командная система",
    eyebrow: "Слой разговоров и устройств",
    title: "Загружайте разговоры. Превращайте их в память, решения и следующие действия.",
    subtitle:
      "Переносите записи встреч, звонки, файлы диктофонов, транскрипты и заметки в единый поток разбора.",
    cta: "Открыть систему",
    uploadTitle: "Прием разговоров",
    uploadText:
      "Загружайте аудио, видео, транскрипты или заметки встреч, затем проверяйте саммари, решения, риски и проектные действия до сохранения.",
    safe: "Обработка остается контролируемой и проходит через ревью.",
    flow: ["Записать", "Загрузить", "Проверить", "Извлечь", "Действовать"],
    devicesTitle: "Первые практичные устройства",
    devicesText:
      "Начинайте с устройств и инструментов, которые экспортируют записи или транскрипты. Прямые интеграции должны быть ограничены, проверяемы и утверждены.",
    outcomesTitle: "Что система может создать из разговора",
    outcomes: ["Саммари", "Следующие действия", "Риски", "Обновления проектов"],
  },
  uk: {
    home: "Головна",
    signIn: "Увійти",
    system: "командна система",
    eyebrow: "Шар розмов і пристроїв",
    title: "Завантажуйте розмови. Перетворюйте їх на пам'ять, рішення і наступні дії.",
    subtitle:
      "Переносьте записи зустрічей, дзвінки, файли диктофонів, транскрипти і нотатки в єдиний потік огляду.",
    cta: "Відкрити систему",
    uploadTitle: "Прийом розмов",
    uploadText:
      "Завантажуйте аудіо, відео, транскрипти або нотатки зустрічей, потім перевіряйте summary, рішення, ризики і проєктні дії до збереження.",
    safe: "Обробка залишається контрольованою і проходить через огляд.",
    flow: ["Записати", "Завантажити", "Перевірити", "Витягти", "Діяти"],
    devicesTitle: "Перші практичні пристрої",
    devicesText:
      "Починайте з пристроїв та інструментів, які експортують записи або транскрипти. Прямі інтеграції мають бути обмежені, перевірювані і затверджені.",
    outcomesTitle: "Що система може створити з розмови",
    outcomes: ["Summary", "Наступні дії", "Ризики", "Оновлення проєктів"],
  },
  es: {
    home: "Inicio",
    signIn: "Entrar",
    system: "sistema de mando",
    eyebrow: "Capa de conversaciones y dispositivos",
    title: "Sube conversaciones. Conviértelas en memoria, decisiones y próximas acciones.",
    subtitle:
      "Lleva grabaciones, llamadas, archivos de grabadoras, transcripciones y notas a un solo flujo de revisión.",
    cta: "Abrir espacio",
    uploadTitle: "Entrada de conversaciones",
    uploadText:
      "Sube audio, video, transcripciones o notas, luego revisa resúmenes, decisiones, riesgos y acciones antes de guardar.",
    safe: "El procesamiento se mantiene controlado y con revisión previa.",
    flow: ["Grabar", "Subir", "Revisar", "Extraer", "Actuar"],
    devicesTitle: "Primeros dispositivos prácticos",
    devicesText:
      "Empieza con dispositivos y herramientas que exporten grabaciones o transcripciones. Las integraciones directas deben ser acotadas, auditables y aprobadas.",
    outcomesTitle: "Qué puede crear el sistema desde una conversación",
    outcomes: ["Resumen", "Próximas acciones", "Riesgos", "Actualizaciones"],
  },
  de: {
    home: "Home",
    signIn: "Anmelden",
    system: "Command System",
    eyebrow: "Gesprächs- und Geräteebene",
    title: "Gespräche hochladen. Daraus Memory, Entscheidungen und nächste Aktionen machen.",
    subtitle:
      "Bringe Meeting-Aufnahmen, Telefonate, Recorder-Dateien, Transkripte und Notizen in einen Review-Flow.",
    cta: "Workspace öffnen",
    uploadTitle: "Gesprächs-Intake",
    uploadText:
      "Lade Audio, Video, Transkripte oder Meeting-Notizen hoch und prüfe Zusammenfassungen, Entscheidungen, Risiken und Projektaktionen vor dem Speichern.",
    safe: "Verarbeitung bleibt kontrolliert und review-first.",
    flow: ["Aufnehmen", "Hochladen", "Prüfen", "Extrahieren", "Handeln"],
    devicesTitle: "Erste praktische Geräte",
    devicesText:
      "Beginne mit Geräten und Tools, die Aufnahmen oder Transkripte exportieren. Direkte Integrationen sollten klar begrenzt, auditierbar und freigegeben sein.",
    outcomesTitle: "Was das System aus einem Gespräch erstellen kann",
    outcomes: ["Zusammenfassung", "Nächste Aktionen", "Risiken", "Projektupdates"],
  },
};

const devices = [
  ["Pocket voice recorders", "Voice notes, calls, and fast personal captures", Mic],
  ["Meeting capture apps", "Team meetings, client calls, transcripts, and notes", Headphones],
  ["Wearable recorders", "Moving, driving, walking, and quick context capture", Watch],
  ["Ambient work devices", "Future hands-free work context after privacy review", Cable],
] as const;

function DeviceConnectionsPage() {
  const { lang } = useI18n();
  const c = copy[lang as keyof typeof copy] ?? copy.en;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-slate-950 dark:bg-[#061014] dark:text-white">
      <section className="relative bg-[linear-gradient(135deg,#f7faf8_0%,#e8fff6_36%,#eaf4ff_72%,#fff7e7_100%)] dark:bg-[linear-gradient(135deg,#061014_0%,#0d2830_42%,#10203b_76%,#211a0f_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(59,130,246,0.18),transparent_28%)]" />
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex flex-col leading-none">
              <BrandWordmark size={34} />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">
                {c.system}
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
              {c.signIn}
              <ArrowRight className="hidden size-3.5 sm:block" />
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-5 pb-16 pt-8 md:px-8 md:pb-24 md:pt-14 lg:grid-cols-[0.95fr_0.75fr] lg:items-center">
          <div>
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-white/62 dark:hover:text-white"
            >
              <ArrowLeft className="size-4" />
              {c.home}
            </Link>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/62 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-white/70">
              <FileAudio className="size-3.5 text-teal-600 dark:text-teal-200" />
              {c.eyebrow}
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white md:text-6xl">
              {c.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-white/70 md:text-xl">
              {c.subtitle}
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-xl shadow-slate-950/15 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
            >
              {c.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-sky-400 to-amber-300" />
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {c.uploadTitle}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">1inow</h2>
                </div>
                <UploadCloud className="size-7 text-teal-300" />
              </div>
              <div className="mt-6 grid grid-cols-5 gap-2">
                {c.flow.map((step, index) => (
                  <div key={step} className="rounded-2xl bg-white/8 p-3">
                    <div className="mb-8 size-2 rounded-full bg-teal-300" />
                    <div className="text-lg font-semibold">{index + 1}</div>
                    <div className="mt-1 text-[10px] leading-4 text-white/54">{step}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-white/64">
              {c.uploadText}
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200">
              <ShieldCheck className="size-4 shrink-0" />
              {c.safe}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{c.devicesTitle}</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-white/64">
              {c.devicesText}
            </p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {devices.map(([name, description, Icon]) => (
              <article
                key={name}
                className="relative overflow-hidden rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-5 shadow-sm transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.055]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400/80 via-sky-400/70 to-amber-300/80" />
                <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-500/16 via-blue-500/12 to-amber-400/16 text-teal-700 dark:text-teal-200">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold">{name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/62">
                  {description}
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-200">
                  <CheckCircle2 className="size-3.5" />
                  Export first
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-[1.5rem] border border-slate-900/8 bg-white/72 p-5 dark:border-white/10 dark:bg-white/[0.055]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="size-4 text-teal-600 dark:text-teal-200" />
              {c.outcomesTitle}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {c.outcomes.map((item) => (
                <div
                  key={item}
                  className="flex min-h-24 flex-col justify-between rounded-2xl border border-slate-900/8 bg-slate-950/[0.03] p-4 text-sm font-medium dark:border-white/10 dark:bg-white/[0.055]"
                >
                  <CheckCircle2 className="size-4 text-teal-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {c.flow.slice(2).map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-teal-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicAssistantPersonas />
      <PublicFooter />
    </main>
  );
}
