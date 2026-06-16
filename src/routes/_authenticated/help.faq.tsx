import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, SectionHeader, SafeCard, Body } from "@/components/layout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/help/faq")({
  component: FaqPage,
});

type QA = { q: string; a: string };
type Pack = { title: string; subtitle: string; items: QA[] };

const CONTENT: Record<string, Pack> = {
  en: {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers about Digital Invest Compass — accounts, AI, projects and data.",
    items: [
      { q: "What is Digital Invest Compass?", a: "An AI-grounded workspace for investment teams: projects, decisions, communications and a memory layer Compass can reason over." },
      { q: "How do I switch language?", a: "Open the language switcher in the top bar. Your choice is stored on your profile and applies on every device." },
      { q: "Where does Compass get its answers?", a: "From your verified data only — projects, tasks, decisions, memory and rules you taught it. It never invents facts and always shows confidence." },
      { q: "How do I invite a colleague?", a: "Administrators can send invitations from Administration → Invitations. New users get a magic link by email." },
      { q: "Can I export my data?", a: "Yes. Use Administration → System to request a full export. Personal exports are available from Settings." },
      { q: "Is my data private?", a: "Row-level security isolates every workspace. See the Privacy Policy for storage, retention and processing details." },
    ],
  },
  ru: {
    title: "Часто задаваемые вопросы",
    subtitle: "Короткие ответы о Digital Invest Compass — аккаунты, ИИ, проекты и данные.",
    items: [
      { q: "Что такое Digital Invest Compass?", a: "Рабочее пространство для инвест-команд с ИИ: проекты, решения, коммуникации и память, на которой Compass рассуждает." },
      { q: "Как сменить язык?", a: "Откройте переключатель языков в верхней панели. Выбор сохраняется в профиле и применяется на всех устройствах." },
      { q: "Откуда Compass берёт ответы?", a: "Только из ваших проверенных данных — проекты, задачи, решения, память и правила. Он не выдумывает факты и всегда показывает уверенность." },
      { q: "Как пригласить коллегу?", a: "Администратор отправляет приглашение в разделе Администрирование → Приглашения. Новый пользователь получит magic-link на e-mail." },
      { q: "Можно ли выгрузить мои данные?", a: "Да. В разделе Администрирование → Система можно запросить полный экспорт. Личный экспорт доступен в Настройках." },
      { q: "Мои данные приватны?", a: "Row-level security изолирует каждое пространство. Подробности в Политике конфиденциальности." },
    ],
  },
  uk: {
    title: "Часті питання",
    subtitle: "Короткі відповіді про Digital Invest Compass — акаунти, ШІ, проєкти і дані.",
    items: [
      { q: "Що таке Digital Invest Compass?", a: "Робочий простір для інвест-команд із ШІ: проєкти, рішення, комунікації та пам'ять, на якій міркує Compass." },
      { q: "Як змінити мову?", a: "Відкрийте перемикач мов у верхній панелі. Вибір зберігається у профілі та застосовується на всіх пристроях." },
      { q: "Звідки Compass бере відповіді?", a: "Лише з перевірених ваших даних — проєкти, задачі, рішення, пам'ять та правила. Він не вигадує факти і завжди показує впевненість." },
      { q: "Як запросити колегу?", a: "Адміністратор надсилає запрошення з Адміністрування → Запрошення. Новий користувач отримає magic-link на e-mail." },
      { q: "Чи можна вивантажити дані?", a: "Так. В Адмініструванні → Система можна запросити повний експорт. Особистий експорт доступний у Налаштуваннях." },
      { q: "Чи приватні мої дані?", a: "Row-level security ізолює кожен простір. Деталі — у Політиці конфіденційності." },
    ],
  },
  es: {
    title: "Preguntas frecuentes",
    subtitle: "Respuestas rápidas sobre Digital Invest Compass: cuentas, IA, proyectos y datos.",
    items: [
      { q: "¿Qué es Digital Invest Compass?", a: "Un espacio de trabajo con IA para equipos de inversión: proyectos, decisiones, comunicaciones y una capa de memoria sobre la que razona Compass." },
      { q: "¿Cómo cambio de idioma?", a: "Usa el selector de idioma de la barra superior. Tu elección queda en tu perfil y se aplica en todos los dispositivos." },
      { q: "¿De dónde obtiene Compass sus respuestas?", a: "Solo de tus datos verificados: proyectos, tareas, decisiones, memoria y reglas. Nunca inventa y siempre muestra confianza." },
      { q: "¿Cómo invito a un compañero?", a: "Los administradores envían invitaciones desde Administración → Invitaciones. El usuario recibirá un enlace mágico por correo." },
      { q: "¿Puedo exportar mis datos?", a: "Sí. En Administración → Sistema puedes solicitar una exportación completa. El export personal está en Ajustes." },
      { q: "¿Mis datos son privados?", a: "Row-level security aísla cada espacio. Consulta la Política de Privacidad para más detalles." },
    ],
  },
  de: {
    title: "Häufige Fragen",
    subtitle: "Kurze Antworten zu Digital Invest Compass — Konten, KI, Projekte und Daten.",
    items: [
      { q: "Was ist Digital Invest Compass?", a: "Ein KI-gestützter Arbeitsbereich für Investmentteams: Projekte, Entscheidungen, Kommunikation und eine Memory-Ebene, auf der Compass argumentiert." },
      { q: "Wie wechsle ich die Sprache?", a: "Über den Sprachumschalter in der oberen Leiste. Die Auswahl wird im Profil gespeichert und gilt auf allen Geräten." },
      { q: "Woher hat Compass seine Antworten?", a: "Ausschließlich aus deinen verifizierten Daten — Projekte, Aufgaben, Entscheidungen, Memory und Regeln. Es erfindet nichts und zeigt stets eine Konfidenz." },
      { q: "Wie lade ich Kollegen ein?", a: "Administratoren versenden Einladungen unter Administration → Einladungen. Neue Nutzer erhalten einen Magic-Link per E-Mail." },
      { q: "Kann ich meine Daten exportieren?", a: "Ja. Unter Administration → System kannst du einen vollständigen Export anfordern. Persönliche Exporte gibt es in den Einstellungen." },
      { q: "Sind meine Daten privat?", a: "Row-Level-Security isoliert jeden Arbeitsbereich. Details in der Datenschutzerklärung." },
    ],
  },
};

function FaqPage() {
  const { lang } = useI18n();
  const c = CONTENT[lang] ?? CONTENT.en;
  return (
    <PageContainer>
      <SectionHeader title={c.title} description={c.subtitle} />
      <div className="space-y-3">
        {c.items.map((it, i) => (
          <SafeCard key={i}>
            <div className="font-medium">{it.q}</div>
            <Body className="mt-1.5 text-muted-foreground">{it.a}</Body>
          </SafeCard>
        ))}
      </div>
    </PageContainer>
  );
}