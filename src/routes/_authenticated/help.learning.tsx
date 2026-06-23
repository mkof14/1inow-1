import { createFileRoute } from "@tanstack/react-router";
import {
  PageContainer,
  SectionHeader,
  SafeCard,
  ResponsiveGrid,
  Body,
  Label,
} from "@/components/layout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/help/learning")({
  component: LearningPage,
});

type Lesson = { title: string; desc: string; level: string };
type Pack = { title: string; subtitle: string; tracks: { name: string; lessons: Lesson[] }[] };

const CONTENT: Record<string, Pack> = {
  en: {
    title: "Learning Center",
    subtitle: "Get productive with 1inow — short, opinionated guides for every role.",
    tracks: [
      {
        name: "Getting started",
        lessons: [
          {
            title: "First 10 minutes",
            desc: "Sign in, set language, connect your calendar, open your first project.",
            level: "Beginner",
          },
          {
            title: "Navigating the workspace",
            desc: "Sidebar, command bar (⌘K), AI sidebar and the Plus quick-create.",
            level: "Beginner",
          },
          {
            title: "Teaching 1inow",
            desc: "How memory, rules and confidence work — and how to correct an answer.",
            level: "Beginner",
          },
        ],
      },
      {
        name: "Projects & execution",
        lessons: [
          {
            title: "Designing a project",
            desc: "Goals, stages, owners and decision points that scale across the portfolio.",
            level: "Intermediate",
          },
          {
            title: "Tasks & approvals",
            desc: "Run kanban work, route approvals, and keep an auditable trail.",
            level: "Intermediate",
          },
        ],
      },
      {
        name: "Intelligence",
        lessons: [
          {
            title: "Reports that ship decisions",
            desc: "From raw data to a decision 1inow can defend with sources.",
            level: "Advanced",
          },
          {
            title: "Agents & workflows",
            desc: "Spawn temporary agents, chain workflows, keep humans in the loop.",
            level: "Advanced",
          },
        ],
      },
      {
        name: "Voice & devices",
        lessons: [
          {
            title: "Importing conversations",
            desc: "Upload meeting recordings, phone calls, transcripts, and recorder files into Devices.",
            level: "Beginner",
          },
          {
            title: "Nova and Vera review",
            desc: "Nova extracts next actions while Vera checks risk, meaning, and missing context before anything moves.",
            level: "Intermediate",
          },
        ],
      },
    ],
  },
  ru: {
    title: "Учебный центр",
    subtitle: "Освойте 1inow быстро — короткие практичные гайды для каждой роли.",
    tracks: [
      {
        name: "Начало работы",
        lessons: [
          {
            title: "Первые 10 минут",
            desc: "Вход, язык, календарь и первый проект.",
            level: "Базовый",
          },
          {
            title: "Навигация по системе",
            desc: "Сайдбар, командная строка (⌘K), AI-панель и быстрая кнопка Плюс.",
            level: "Базовый",
          },
          {
            title: "Учим 1inow",
            desc: "Как работают память, правила и уверенность — и как поправить ответ.",
            level: "Базовый",
          },
        ],
      },
      {
        name: "Проекты и исполнение",
        lessons: [
          {
            title: "Дизайн проекта",
            desc: "Цели, стадии, владельцы и точки решений, которые масштабируются.",
            level: "Средний",
          },
          {
            title: "Задачи и согласования",
            desc: "Канбан, маршруты согласований, аудируемый след.",
            level: "Средний",
          },
        ],
      },
      {
        name: "Аналитика",
        lessons: [
          {
            title: "Отчёты, рождающие решения",
            desc: "От сырых данных к решению, которое 1inow защитит источниками.",
            level: "Продвинутый",
          },
          {
            title: "Агенты и воркфлоу",
            desc: "Временные агенты, цепочки воркфлоу, человек в контуре.",
            level: "Продвинутый",
          },
        ],
      },
      {
        name: "Голос и устройства",
        lessons: [
          {
            title: "Импорт разговоров",
            desc: "Загружайте записи встреч, звонки, транскрипты и файлы диктофонов в Devices.",
            level: "Базовый",
          },
          {
            title: "Ревью Nova и Vera",
            desc: "Nova выделяет действия, а Vera проверяет риск, смысл и недостающий контекст до движения.",
            level: "Средний",
          },
        ],
      },
    ],
  },
  uk: {
    title: "Навчальний центр",
    subtitle: "Швидко опануйте 1inow — короткі практичні гайди для кожної ролі.",
    tracks: [
      {
        name: "Початок роботи",
        lessons: [
          {
            title: "Перші 10 хвилин",
            desc: "Вхід, мова, календар і перший проєкт.",
            level: "Базовий",
          },
          {
            title: "Навігація",
            desc: "Сайдбар, командний рядок (⌘K), AI-панель та кнопка Плюс.",
            level: "Базовий",
          },
          {
            title: "Навчаємо 1inow",
            desc: "Як працюють пам'ять, правила та впевненість — і як виправити відповідь.",
            level: "Базовий",
          },
        ],
      },
      {
        name: "Проєкти та виконання",
        lessons: [
          {
            title: "Дизайн проєкту",
            desc: "Цілі, етапи, власники й точки рішень для всього портфеля.",
            level: "Середній",
          },
          {
            title: "Задачі та узгодження",
            desc: "Канбан, маршрути узгоджень, аудит.",
            level: "Середній",
          },
        ],
      },
      {
        name: "Аналітика",
        lessons: [
          {
            title: "Звіти, що ведуть до рішень",
            desc: "Від сирих даних до рішення з джерелами.",
            level: "Просунутий",
          },
          {
            title: "Агенти та воркфлоу",
            desc: "Тимчасові агенти, ланцюги воркфлоу, людина у контурі.",
            level: "Просунутий",
          },
        ],
      },
      {
        name: "Голос і пристрої",
        lessons: [
          {
            title: "Імпорт розмов",
            desc: "Завантажуйте записи зустрічей, дзвінки, транскрипти і файли диктофонів у Devices.",
            level: "Базовий",
          },
          {
            title: "Огляд Nova і Vera",
            desc: "Nova виділяє дії, а Vera перевіряє ризик, сенс і відсутній контекст до руху.",
            level: "Середній",
          },
        ],
      },
    ],
  },
  es: {
    title: "Centro de aprendizaje",
    subtitle: "Domina 1inow rápido — guías cortas y prácticas para cada rol.",
    tracks: [
      {
        name: "Primeros pasos",
        lessons: [
          {
            title: "Primeros 10 minutos",
            desc: "Inicio, idioma, calendario y tu primer proyecto.",
            level: "Básico",
          },
          {
            title: "Navegar el espacio",
            desc: "Sidebar, barra de comandos (⌘K), panel IA y botón Plus.",
            level: "Básico",
          },
          {
            title: "Enseñar a 1inow",
            desc: "Memoria, reglas y confianza — y cómo corregir una respuesta.",
            level: "Básico",
          },
        ],
      },
      {
        name: "Proyectos y ejecución",
        lessons: [
          {
            title: "Diseñar un proyecto",
            desc: "Objetivos, etapas, responsables y puntos de decisión.",
            level: "Intermedio",
          },
          {
            title: "Tareas y aprobaciones",
            desc: "Kanban, rutas de aprobación, traza auditable.",
            level: "Intermedio",
          },
        ],
      },
      {
        name: "Inteligencia",
        lessons: [
          {
            title: "Informes que deciden",
            desc: "De los datos a una decisión que 1inow defiende con fuentes.",
            level: "Avanzado",
          },
          {
            title: "Agentes y flujos",
            desc: "Agentes temporales, flujos encadenados, humano en el bucle.",
            level: "Avanzado",
          },
        ],
      },
      {
        name: "Voz y dispositivos",
        lessons: [
          {
            title: "Importar conversaciones",
            desc: "Sube reuniones, llamadas, transcripciones y archivos de grabadoras en Devices.",
            level: "Básico",
          },
          {
            title: "Revisión Nova y Vera",
            desc: "Nova extrae acciones y Vera revisa riesgo, significado y contexto faltante antes de actuar.",
            level: "Intermedio",
          },
        ],
      },
    ],
  },
  de: {
    title: "Lernzentrum",
    subtitle: "Werde schnell produktiv mit 1inow — kurze Anleitungen für jede Rolle.",
    tracks: [
      {
        name: "Erste Schritte",
        lessons: [
          {
            title: "Die ersten 10 Minuten",
            desc: "Anmeldung, Sprache, Kalender, erstes Projekt.",
            level: "Einsteiger",
          },
          {
            title: "Im Workspace navigieren",
            desc: "Sidebar, Befehlsleiste (⌘K), KI-Panel und Plus-Button.",
            level: "Einsteiger",
          },
          {
            title: "1inow trainieren",
            desc: "Wie Memory, Regeln und Konfidenz wirken — und wie du Antworten korrigierst.",
            level: "Einsteiger",
          },
        ],
      },
      {
        name: "Projekte & Ausführung",
        lessons: [
          {
            title: "Ein Projekt entwerfen",
            desc: "Ziele, Phasen, Owner und Entscheidungspunkte für das Portfolio.",
            level: "Fortgeschritten",
          },
          {
            title: "Aufgaben & Freigaben",
            desc: "Kanban, Freigabeketten, auditierbare Spur.",
            level: "Fortgeschritten",
          },
        ],
      },
      {
        name: "Intelligence",
        lessons: [
          {
            title: "Berichte, die entscheiden",
            desc: "Von Rohdaten zur Entscheidung mit Quellen.",
            level: "Profi",
          },
          {
            title: "Agenten & Workflows",
            desc: "Temporäre Agenten, verkettete Workflows, Human-in-the-Loop.",
            level: "Profi",
          },
        ],
      },
      {
        name: "Voice & Geräte",
        lessons: [
          {
            title: "Gespräche importieren",
            desc: "Lade Meetings, Calls, Transkripte und Recorder-Dateien in Devices hoch.",
            level: "Einsteiger",
          },
          {
            title: "Nova und Vera Review",
            desc: "Nova extrahiert Aktionen, Vera prüft Risiko, Bedeutung und fehlenden Kontext vor jeder Bewegung.",
            level: "Fortgeschritten",
          },
        ],
      },
    ],
  },
};

function LearningPage() {
  const { lang } = useI18n();
  const c = CONTENT[lang] ?? CONTENT.en;
  return (
    <PageContainer>
      <SectionHeader title={c.title} description={c.subtitle} />
      <div className="space-y-8">
        {c.tracks.map((tr) => (
          <section key={tr.name}>
            <Label className="mb-3 block">{tr.name}</Label>
            <ResponsiveGrid min={260}>
              {tr.lessons.map((l) => (
                <SafeCard key={l.title}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{l.title}</div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                      {l.level}
                    </span>
                  </div>
                  <Body className="mt-1.5 text-muted-foreground">{l.desc}</Body>
                </SafeCard>
              ))}
            </ResponsiveGrid>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
