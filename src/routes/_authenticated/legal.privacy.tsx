import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, SectionHeader } from "@/components/layout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/legal/privacy")({
  component: PrivacyPage,
});

type Section = { h: string; p: string };
type Pack = { title: string; subtitle: string; updated: string; sections: Section[] };

const CONTENT: Record<string, Pack> = {
  en: {
    title: "Privacy Policy",
    subtitle: "How 1inow collects, stores and processes your data.",
    updated: "Last updated: June 2026",
    sections: [
      { h: "1. Data we collect", p: "Account profile (name, email, language, role), workspace data you create (projects, tasks, files, messages), authentication metadata, and product telemetry needed to operate the service." },
      { h: "2. How we use it", p: "To run the workspace, personalise 1inow for your team, secure the system against abuse and improve product reliability. We never sell personal data." },
      { h: "3. AI processing", p: "Prompts and selected context are sent to vetted model providers strictly to generate the response. Outputs are stored in your workspace under row-level security. You can purge AI memory at any time from Intelligence." },
      { h: "4. Storage & retention", p: "Data is stored in encrypted Postgres with row-level security. Backups are retained for 30 days. You can request export or deletion from Administration → System." },
      { h: "5. Sharing", p: "We share data only with infrastructure subprocessors required to run the service (hosting, email, AI inference) under data-processing agreements." },
      { h: "6. Your rights", p: "Access, rectification, export and deletion. Contact privacy@compass.app — we respond within 30 days." },
      { h: "7. Changes", p: "We will notify workspace administrators of material changes at least 14 days before they take effect." },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    subtitle: "Как 1inow собирает, хранит и обрабатывает ваши данные.",
    updated: "Обновлено: июнь 2026",
    sections: [
      { h: "1. Какие данные мы собираем", p: "Профиль (имя, e-mail, язык, роль), рабочие данные (проекты, задачи, файлы, сообщения), метаданные аутентификации и продуктовая телеметрия для работы сервиса." },
      { h: "2. Как мы их используем", p: "Для работы пространства, персонализации 1inow под вашу команду, защиты от злоупотреблений и улучшения сервиса. Мы не продаём персональные данные." },
      { h: "3. Обработка ИИ", p: "Промпты и выбранный контекст отправляются проверенным провайдерам моделей только для генерации ответа. Результаты хранятся в вашем пространстве под row-level security. Память ИИ можно очистить в разделе Intelligence." },
      { h: "4. Хранение и сроки", p: "Данные хранятся в зашифрованном Postgres с RLS. Бэкапы — 30 дней. Экспорт и удаление — Администрирование → Система." },
      { h: "5. Передача третьим лицам", p: "Только инфраструктурным субпроцессорам (хостинг, e-mail, ИИ-инференс) по DPA." },
      { h: "6. Ваши права", p: "Доступ, исправление, экспорт и удаление. Пишите на privacy@compass.app — отвечаем в течение 30 дней." },
      { h: "7. Изменения", p: "О существенных изменениях мы уведомим администраторов не позднее, чем за 14 дней." },
    ],
  },
  uk: {
    title: "Політика конфіденційності",
    subtitle: "Як 1inow збирає, зберігає та обробляє ваші дані.",
    updated: "Оновлено: червень 2026",
    sections: [
      { h: "1. Які дані ми збираємо", p: "Профіль (ім'я, e-mail, мова, роль), робочі дані (проєкти, задачі, файли, повідомлення), метадані автентифікації, продуктова телеметрія." },
      { h: "2. Як ми їх використовуємо", p: "Для роботи простору, персоналізації 1inow, захисту від зловживань і поліпшення сервісу. Ми не продаємо персональні дані." },
      { h: "3. Обробка ШІ", p: "Промпти та обраний контекст надсилаються перевіреним провайдерам моделей виключно для відповіді. Результати зберігаються у вашому просторі під RLS. Пам'ять ШІ можна очистити в Intelligence." },
      { h: "4. Зберігання та терміни", p: "Зашифрований Postgres з RLS. Бекапи — 30 днів. Експорт/видалення — Адміністрування → Система." },
      { h: "5. Передача третім сторонам", p: "Лише інфраструктурним субпроцесорам (хостинг, e-mail, ШІ) за DPA." },
      { h: "6. Ваші права", p: "Доступ, виправлення, експорт, видалення. Пишіть на privacy@compass.app — відповідаємо протягом 30 днів." },
      { h: "7. Зміни", p: "Про суттєві зміни сповіщаємо адміністраторів щонайменше за 14 днів." },
    ],
  },
  es: {
    title: "Política de privacidad",
    subtitle: "Cómo 1inow recopila, almacena y procesa tus datos.",
    updated: "Actualizado: junio de 2026",
    sections: [
      { h: "1. Qué datos recopilamos", p: "Perfil (nombre, correo, idioma, rol), datos del espacio (proyectos, tareas, archivos, mensajes), metadatos de autenticación y telemetría del producto." },
      { h: "2. Cómo los usamos", p: "Para operar el espacio, personalizar 1inow, proteger el sistema y mejorarlo. Nunca vendemos datos personales." },
      { h: "3. Procesamiento de IA", p: "Los prompts y el contexto se envían a proveedores de modelos verificados solo para generar la respuesta. La salida queda en tu espacio con RLS. Puedes purgar la memoria desde Intelligence." },
      { h: "4. Almacenamiento", p: "Postgres cifrado con RLS. Copias de seguridad 30 días. Exportación/eliminación en Administración → Sistema." },
      { h: "5. Compartición", p: "Solo con subprocesadores de infraestructura (hosting, correo, IA) bajo DPA." },
      { h: "6. Tus derechos", p: "Acceso, rectificación, exportación y eliminación. Escribe a privacy@compass.app — respondemos en 30 días." },
      { h: "7. Cambios", p: "Notificaremos a los administradores con 14 días de antelación." },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    subtitle: "Wie 1inow Daten erhebt, speichert und verarbeitet.",
    updated: "Stand: Juni 2026",
    sections: [
      { h: "1. Erhobene Daten", p: "Profil (Name, E-Mail, Sprache, Rolle), Workspace-Inhalte (Projekte, Aufgaben, Dateien, Nachrichten), Auth-Metadaten und Produkttelemetrie." },
      { h: "2. Verwendung", p: "Betrieb des Workspaces, Personalisierung von 1inow, Schutz vor Missbrauch und Produktverbesserung. Wir verkaufen keine personenbezogenen Daten." },
      { h: "3. KI-Verarbeitung", p: "Prompts und ausgewählter Kontext gehen ausschließlich zur Antworterzeugung an geprüfte Modellanbieter. Ergebnisse bleiben in deinem Workspace unter RLS. Memory kann in Intelligence gelöscht werden." },
      { h: "4. Speicherung", p: "Verschlüsseltes Postgres mit RLS. Backups 30 Tage. Export/Löschung über Administration → System." },
      { h: "5. Weitergabe", p: "Nur an Infrastruktur-Subprozessoren (Hosting, E-Mail, KI) unter AVV." },
      { h: "6. Deine Rechte", p: "Auskunft, Berichtigung, Export, Löschung. Schreibe an privacy@compass.app — Antwort binnen 30 Tagen." },
      { h: "7. Änderungen", p: "Wesentliche Änderungen kündigen wir Administratoren mindestens 14 Tage vorher an." },
    ],
  },
};

function PrivacyPage() {
  const { lang } = useI18n();
  const c = CONTENT[lang] ?? CONTENT.en;
  return (
    <PageContainer size="narrow">
      <SectionHeader title={c.title} description={c.subtitle} />
      <p className="mb-6 text-xs uppercase tracking-wider text-muted-foreground">{c.updated}</p>
      <div className="space-y-6 leading-relaxed">
        {c.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-base font-semibold tracking-tight">{s.h}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}