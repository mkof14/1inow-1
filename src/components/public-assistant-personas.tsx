import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const assistantCopy = {
  en: {
    eyebrow: "Nova + Vera",
    title: "Two voices make the assistant easier to trust.",
    text: "1inow is designed around a simple human pattern: one voice helps you move, the other helps you think before you move.",
    cta: "Open workspace",
    assistants: [
      {
        name: "Nova",
        role: "Execution voice",
        text: "Nova turns voice commands into the next useful action: create a task, open a project, plan a reminder, or move the day forward.",
        focus: "Action, speed, momentum",
        image: "/assistants/nova.jpg",
      },
      {
        name: "Vera",
        role: "Review voice",
        text: "Vera filters meaning, priority, and risk. When a command is unclear, Vera asks before the system acts.",
        focus: "Meaning, risk, priority",
        image: "/assistants/vera.jpg",
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
    title: "Два голоса делают помощника понятнее и надежнее.",
    text: "1inow строится на простой человеческой логике: один голос помогает двигаться, второй помогает подумать перед действием.",
    cta: "Открыть систему",
    assistants: [
      {
        name: "Nova",
        role: "Голос исполнения",
        text: "Nova превращает голосовые команды в ближайшее полезное действие: создать задачу, открыть проект, запланировать напоминание или сдвинуть день вперед.",
        focus: "Действие, скорость, движение",
        image: "/assistants/nova.jpg",
      },
      {
        name: "Vera",
        role: "Голос проверки",
        text: "Vera фильтрует смысл, приоритет и риск. Если команда неясна, Vera уточняет до того, как система начнет действовать.",
        focus: "Смысл, риск, приоритет",
        image: "/assistants/vera.jpg",
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
    title: "Два голоси роблять помічника зрозумілішим і надійнішим.",
    text: "1inow будується на простій людській логіці: один голос допомагає рухатися, другий допомагає подумати перед дією.",
    cta: "Відкрити систему",
    assistants: [
      {
        name: "Nova",
        role: "Голос виконання",
        text: "Nova перетворює голосові команди на найближчу корисну дію: створити задачу, відкрити проєкт, запланувати нагадування або зрушити день вперед.",
        focus: "Дія, швидкість, рух",
        image: "/assistants/nova.jpg",
      },
      {
        name: "Vera",
        role: "Голос перевірки",
        text: "Vera фільтрує сенс, пріоритет і ризик. Якщо команда неясна, Vera уточнює до того, як система почне діяти.",
        focus: "Сенс, ризик, пріоритет",
        image: "/assistants/vera.jpg",
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
    title: "Dos voces hacen que el asistente sea más claro y confiable.",
    text: "1inow sigue un patrón humano simple: una voz ayuda a avanzar, la otra ayuda a pensar antes de actuar.",
    cta: "Abrir espacio",
    assistants: [
      {
        name: "Nova",
        role: "Voz de ejecución",
        text: "Nova convierte comandos de voz en la siguiente acción útil: crear una tarea, abrir un proyecto, planificar un recordatorio o mover el día.",
        focus: "Acción, velocidad, impulso",
        image: "/assistants/nova.jpg",
      },
      {
        name: "Vera",
        role: "Voz de revisión",
        text: "Vera filtra significado, prioridad y riesgo. Si el comando no está claro, Vera pregunta antes de que el sistema actúe.",
        focus: "Significado, riesgo, prioridad",
        image: "/assistants/vera.jpg",
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
    title: "Zwei Stimmen machen den Assistenten klarer und vertrauenswürdiger.",
    text: "1inow folgt einem einfachen menschlichen Muster: Eine Stimme hilft beim Vorankommen, die andere beim Denken vor der Aktion.",
    cta: "Workspace öffnen",
    assistants: [
      {
        name: "Nova",
        role: "Ausführungsstimme",
        text: "Nova macht aus Sprachbefehlen den nächsten nützlichen Schritt: Aufgabe erstellen, Projekt öffnen, Erinnerung planen oder den Tag bewegen.",
        focus: "Aktion, Tempo, Bewegung",
        image: "/assistants/nova.jpg",
      },
      {
        name: "Vera",
        role: "Prüfstimme",
        text: "Vera filtert Bedeutung, Priorität und Risiko. Wenn ein Befehl unklar ist, fragt Vera, bevor das System handelt.",
        focus: "Bedeutung, Risiko, Priorität",
        image: "/assistants/vera.jpg",
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
            <Sparkles className="size-3.5" />
            {copy.eyebrow}
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white md:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-white/64">{copy.text}</p>
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
