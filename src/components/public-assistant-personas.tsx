import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, MessageCircle, Radio, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SENSE_ASSETS } from "@/lib/sense-assets";

const assistantCopy = {
  en: {
    eyebrow: "Nova + Vera",
    title: "Nova and Vera stay with you as two living senses of the system.",
    text: "Nova listens for movement. Vera watches for meaning, risk, and missing context. Together they make 1inow feel less like software and more like a daily operating partner.",
    cta: "Open workspace",
    listening: "Always listening layer",
    watching: "Context watching layer",
    assistants: [
      {
        name: "Nova",
        role: "Execution voice",
        text: "Nova turns voice commands into the next useful action: create a task, open a project, plan a reminder, or move the day forward.",
        focus: "Action, speed, momentum",
        image: SENSE_ASSETS.nova,
      },
      {
        name: "Vera",
        role: "Review voice",
        text: "Vera filters meaning, priority, and risk. When a command is unclear, Vera asks before the system acts.",
        focus: "Meaning, risk, priority",
        image: SENSE_ASSETS.vera,
      },
    ],
    proof: [
      "Fewer blind actions",
      "Clearer decisions",
      "Better voice experience",
      "More human daily workflow",
    ],
  },
  ru: {
    eyebrow: "Nova + Vera",
    title: "Nova и Vera становятся двумя живыми чувствами системы.",
    text: "Nova слушает движение. Vera смотрит на смысл, риск и недостающий контекст. Вместе они делают 1inow не просто софтом, а ежедневным рабочим партнером.",
    cta: "Открыть систему",
    listening: "Слой постоянного слуха",
    watching: "Слой контекстного зрения",
    assistants: [
      {
        name: "Nova",
        role: "Голос исполнения",
        text: "Nova превращает голосовые команды в ближайшее полезное действие: создать задачу, открыть проект, запланировать напоминание или сдвинуть день вперед.",
        focus: "Действие, скорость, движение",
        image: SENSE_ASSETS.nova,
      },
      {
        name: "Vera",
        role: "Голос проверки",
        text: "Vera фильтрует смысл, приоритет и риск. Если команда неясна, Vera уточняет до того, как система начнет действовать.",
        focus: "Смысл, риск, приоритет",
        image: SENSE_ASSETS.vera,
      },
    ],
    proof: [
      "Меньше слепых действий",
      "Яснее решения",
      "Лучше голосовой опыт",
      "Более человеческий рабочий день",
    ],
  },
  uk: {
    eyebrow: "Nova + Vera",
    title: "Nova і Vera стають двома живими відчуттями системи.",
    text: "Nova слухає рух. Vera дивиться на сенс, ризик і відсутній контекст. Разом вони роблять 1inow не просто софтом, а щоденним робочим партнером.",
    cta: "Відкрити систему",
    listening: "Шар постійного слуху",
    watching: "Шар контекстного зору",
    assistants: [
      {
        name: "Nova",
        role: "Голос виконання",
        text: "Nova перетворює голосові команди на найближчу корисну дію: створити задачу, відкрити проєкт, запланувати нагадування або зрушити день вперед.",
        focus: "Дія, швидкість, рух",
        image: SENSE_ASSETS.nova,
      },
      {
        name: "Vera",
        role: "Голос перевірки",
        text: "Vera фільтрує сенс, пріоритет і ризик. Якщо команда неясна, Vera уточнює до того, як система почне діяти.",
        focus: "Сенс, ризик, пріоритет",
        image: SENSE_ASSETS.vera,
      },
    ],
    proof: [
      "Менше сліпих дій",
      "Чіткіші рішення",
      "Кращий голосовий досвід",
      "Більш людський робочий день",
    ],
  },
  es: {
    eyebrow: "Nova + Vera",
    title: "Nova y Vera funcionan como dos sentidos vivos del sistema.",
    text: "Nova escucha el movimiento. Vera observa significado, riesgo y contexto faltante. Juntas hacen que 1inow se sienta menos como software y más como un compañero diario.",
    cta: "Abrir espacio",
    listening: "Capa siempre atenta",
    watching: "Capa de contexto visual",
    assistants: [
      {
        name: "Nova",
        role: "Voz de ejecución",
        text: "Nova convierte comandos de voz en la siguiente acción útil: crear una tarea, abrir un proyecto, planificar un recordatorio o mover el día.",
        focus: "Acción, velocidad, impulso",
        image: SENSE_ASSETS.nova,
      },
      {
        name: "Vera",
        role: "Voz de revisión",
        text: "Vera filtra significado, prioridad y riesgo. Si el comando no está claro, Vera pregunta antes de que el sistema actúe.",
        focus: "Significado, riesgo, prioridad",
        image: SENSE_ASSETS.vera,
      },
    ],
    proof: [
      "Menos acciones ciegas",
      "Decisiones más claras",
      "Mejor experiencia de voz",
      "Flujo diario más humano",
    ],
  },
  de: {
    eyebrow: "Nova + Vera",
    title: "Nova und Vera werden zu zwei lebendigen Sinnen des Systems.",
    text: "Nova hört auf Bewegung. Vera achtet auf Bedeutung, Risiko und fehlenden Kontext. Zusammen fühlt sich 1inow weniger wie Software und mehr wie ein täglicher Partner an.",
    cta: "Workspace öffnen",
    listening: "Immer hörende Ebene",
    watching: "Kontext beobachtende Ebene",
    assistants: [
      {
        name: "Nova",
        role: "Ausführungsstimme",
        text: "Nova macht aus Sprachbefehlen den nächsten nützlichen Schritt: Aufgabe erstellen, Projekt öffnen, Erinnerung planen oder den Tag bewegen.",
        focus: "Aktion, Tempo, Bewegung",
        image: SENSE_ASSETS.nova,
      },
      {
        name: "Vera",
        role: "Prüfstimme",
        text: "Vera filtert Bedeutung, Priorität und Risiko. Wenn ein Befehl unklar ist, fragt Vera, bevor das System handelt.",
        focus: "Bedeutung, Risiko, Priorität",
        image: SENSE_ASSETS.vera,
      },
    ],
    proof: [
      "Weniger blinde Aktionen",
      "Klarere Entscheidungen",
      "Bessere Voice Experience",
      "Menschlicherer Arbeitsfluss",
    ],
  },
};

export function PublicAssistantPersonas() {
  const { lang } = useI18n();
  const copy = assistantCopy[lang as keyof typeof assistantCopy] ?? assistantCopy.en;

  return (
    <section id="nova-vera" className="bg-[#f7faf8] px-5 pb-20 dark:bg-[#061014] md:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
        <div className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/62 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-teal-200">
            <Radio className="size-3.5" />
            {copy.eyebrow}
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white md:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-white/64">{copy.text}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-900/8 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                <Radio className="size-4 text-teal-600 dark:text-teal-200" />
                {copy.listening}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-teal-400 to-sky-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-900/8 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                <Eye className="size-4 text-amber-600 dark:text-amber-200" />
                {copy.watching}
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1">
                {[0, 1, 2, 3, 4].map((item) => (
                  <span
                    key={item}
                    className="h-2 rounded-full bg-gradient-to-r from-amber-300 to-teal-300 opacity-70"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {copy.proof.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl border border-slate-900/8 bg-white/64 px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/68"
              >
                <span className="size-2 rounded-full bg-teal-500" />
                {item}
              </div>
            ))}
          </div>
          <Link
            to="/auth"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-xl shadow-slate-950/15 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
          >
            {copy.cta}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {copy.assistants.map((assistant, index) => (
            <div
              key={assistant.name}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-900/8 bg-white/76 shadow-xl shadow-slate-950/5 transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.055]"
            >
              <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={assistant.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/58 via-slate-950/10 to-transparent" />
                <div className="absolute -right-14 -top-14 size-40 rounded-full border border-white/22 opacity-80 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute -right-6 -top-6 size-24 rounded-full border border-white/18 opacity-70 transition-transform duration-700 group-hover:scale-125" />
                <div className="absolute left-5 top-5 grid size-11 place-items-center rounded-2xl border border-white/22 bg-white/14 text-white backdrop-blur">
                  {index === 0 ? (
                    <MessageCircle className="size-5" />
                  ) : (
                    <ShieldCheck className="size-5" />
                  )}
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="text-3xl font-semibold tracking-tight text-white">
                    {assistant.name}
                  </div>
                  <div className="mt-1 text-sm font-medium text-white/76">{assistant.role}</div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-6 text-slate-600 dark:text-white/64">
                  {assistant.text}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-200">
                  {index === 0 ? (
                    <ArrowRight className="size-3.5" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  {assistant.focus}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
