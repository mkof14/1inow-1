import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, SectionHeader } from "@/components/layout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/legal/terms")({
  component: TermsPage,
});

type Section = { h: string; p: string };
type Pack = { title: string; subtitle: string; updated: string; sections: Section[] };

const CONTENT: Record<string, Pack> = {
  en: {
    title: "Terms of Service",
    subtitle: "The agreement between you and 1inow.",
    updated: "Effective: June 2026",
    sections: [
      { h: "1. Acceptance", p: "By creating an account or using the service you agree to these terms and the Privacy Policy." },
      { h: "2. Use of the service", p: "You may use 1inow only for lawful business purposes. You will not attempt to reverse-engineer, abuse the AI, exfiltrate other tenants' data, or disrupt the platform." },
      { h: "3. Accounts", p: "You are responsible for safeguarding credentials and for activity on your account. Notify us immediately of any unauthorised access." },
      { h: "4. Your content", p: "You retain all rights to data you upload. You grant us a limited licence to host and process it to provide the service." },
      { h: "5. AI outputs", p: "AI responses are generated from your data and may contain errors. You are responsible for reviewing outputs before relying on them for material decisions." },
      { h: "6. Availability", p: "We target 99.5% monthly uptime but do not guarantee uninterrupted service. Planned maintenance will be announced in advance." },
      { h: "7. Termination", p: "Either party may terminate with 30 days' notice. We may suspend immediately for abuse or non-payment." },
      { h: "8. Liability", p: "To the maximum extent permitted by law, our aggregate liability is limited to fees paid in the prior 12 months." },
      { h: "9. Governing law", p: "These terms are governed by the laws applicable to the contracting entity stated in your order form." },
    ],
  },
  ru: {
    title: "Условия использования",
    subtitle: "Договор между вами и 1inow.",
    updated: "Действуют с: июнь 2026",
    sections: [
      { h: "1. Принятие", p: "Создавая аккаунт или используя сервис, вы соглашаетесь с этими условиями и Политикой конфиденциальности." },
      { h: "2. Использование", p: "Только в законных бизнес-целях. Запрещены реверс-инжиниринг, злоупотребление ИИ, доступ к данным других тенантов, нарушение работы платформы." },
      { h: "3. Аккаунты", p: "Вы отвечаете за безопасность учётных данных и действия в аккаунте. Сообщайте о несанкционированном доступе незамедлительно." },
      { h: "4. Ваш контент", p: "Все права на загружаемые данные остаются за вами. Вы даёте нам ограниченную лицензию для хостинга и обработки в рамках сервиса." },
      { h: "5. Ответы ИИ", p: "Ответы ИИ генерируются из ваших данных и могут содержать ошибки. Вы обязаны проверять их перед существенными решениями." },
      { h: "6. Доступность", p: "Целевой аптайм 99.5% в месяц. Плановые работы анонсируются заранее." },
      { h: "7. Прекращение", p: "Любая сторона может расторгнуть с уведомлением за 30 дней. Мы можем приостановить аккаунт за злоупотребления или неоплату." },
      { h: "8. Ответственность", p: "В максимально допустимых законом пределах совокупная ответственность ограничена платежами за последние 12 месяцев." },
      { h: "9. Применимое право", p: "Регулируется правом, указанным в вашем контракте." },
    ],
  },
  uk: {
    title: "Умови використання",
    subtitle: "Угода між вами та 1inow.",
    updated: "Чинні з: червень 2026",
    sections: [
      { h: "1. Прийняття", p: "Створюючи акаунт або користуючись сервісом, ви погоджуєтесь з цими умовами та Політикою конфіденційності." },
      { h: "2. Використання", p: "Лише для законних бізнес-цілей. Заборонені реверс-інжиніринг, зловживання ШІ, доступ до даних інших тенантів, порушення роботи платформи." },
      { h: "3. Акаунти", p: "Ви відповідаєте за безпеку облікових даних і дії в акаунті. Повідомляйте про несанкціонований доступ негайно." },
      { h: "4. Ваш контент", p: "Усі права на завантажені дані залишаються за вами. Ви надаєте обмежену ліцензію для хостингу й обробки." },
      { h: "5. Відповіді ШІ", p: "Відповіді генеруються з ваших даних і можуть містити помилки. Перевіряйте їх перед суттєвими рішеннями." },
      { h: "6. Доступність", p: "Цільовий аптайм 99.5% на місяць. Плановані роботи анонсуються заздалегідь." },
      { h: "7. Припинення", p: "Будь-яка сторона може припинити з повідомленням за 30 днів. Ми можемо призупинити акаунт за зловживання чи несплату." },
      { h: "8. Відповідальність", p: "У максимально допустимих законом межах сукупна відповідальність обмежена платежами за останні 12 місяців." },
      { h: "9. Застосовне право", p: "Регулюється правом, зазначеним у вашому контракті." },
    ],
  },
  es: {
    title: "Términos del servicio",
    subtitle: "Acuerdo entre tú y 1inow.",
    updated: "Vigentes desde: junio de 2026",
    sections: [
      { h: "1. Aceptación", p: "Al crear una cuenta o usar el servicio aceptas estos términos y la Política de Privacidad." },
      { h: "2. Uso del servicio", p: "Solo para fines empresariales lícitos. Sin ingeniería inversa, abuso de la IA, acceso a datos de otros inquilinos ni interrupciones." },
      { h: "3. Cuentas", p: "Eres responsable de tus credenciales y actividad. Notifica accesos no autorizados de inmediato." },
      { h: "4. Tu contenido", p: "Conservas los derechos. Nos otorgas una licencia limitada para alojar y procesar tus datos." },
      { h: "5. Salidas de IA", p: "Las respuestas se generan a partir de tus datos y pueden contener errores. Debes revisarlas antes de decisiones materiales." },
      { h: "6. Disponibilidad", p: "Objetivo 99,5% mensual. El mantenimiento programado se anuncia con antelación." },
      { h: "7. Terminación", p: "Cualquiera puede terminar con 30 días de aviso. Podemos suspender por abuso o impago." },
      { h: "8. Responsabilidad", p: "Hasta el máximo legal, la responsabilidad agregada se limita a las cuotas pagadas en los 12 meses previos." },
      { h: "9. Ley aplicable", p: "Se rige por la ley indicada en tu contrato." },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    subtitle: "Vereinbarung zwischen dir und 1inow.",
    updated: "Gültig ab: Juni 2026",
    sections: [
      { h: "1. Annahme", p: "Mit Kontoerstellung oder Nutzung akzeptierst du diese Bedingungen und die Datenschutzerklärung." },
      { h: "2. Nutzung", p: "Nur für rechtmäßige Geschäftszwecke. Kein Reverse-Engineering, KI-Missbrauch, Zugriff auf fremde Tenants, Störungen." },
      { h: "3. Konten", p: "Du bist für Zugangsdaten und Kontoaktivitäten verantwortlich. Melde unautorisierten Zugriff sofort." },
      { h: "4. Deine Inhalte", p: "Du behältst alle Rechte. Du erteilst uns eine begrenzte Lizenz zum Hosten und Verarbeiten." },
      { h: "5. KI-Ausgaben", p: "Antworten basieren auf deinen Daten und können Fehler enthalten. Du musst sie vor wesentlichen Entscheidungen prüfen." },
      { h: "6. Verfügbarkeit", p: "Ziel 99,5% monatlich. Wartungen werden angekündigt." },
      { h: "7. Kündigung", p: "Beide Seiten können mit 30 Tagen Frist kündigen. Wir können bei Missbrauch oder Zahlungsverzug sofort sperren." },
      { h: "8. Haftung", p: "Soweit gesetzlich zulässig, ist die Gesamthaftung auf die Entgelte der letzten 12 Monate begrenzt." },
      { h: "9. Anwendbares Recht", p: "Es gilt das im Vertrag genannte Recht." },
    ],
  },
};

function TermsPage() {
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