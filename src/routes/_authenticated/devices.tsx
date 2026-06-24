import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  ClipboardList,
  FileAudio,
  FileText,
  Headphones,
  Inbox,
  ListChecks,
  Mic,
  ShieldCheck,
  Smartphone,
  Trash2,
  UploadCloud,
  Watch,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer, SectionHeader, SafeCard } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { saveVoiceInboxItem, type VoiceInboxKind } from "@/lib/voice-intake";

export const Route = createFileRoute("/_authenticated/devices")({
  component: DevicesPage,
});

const copy = {
  en: {
    title: "Devices & Conversations",
    subtitle:
      "A practical intake desk for calls, meetings, voice notes, and transcripts. Review raw context, extract decisions, and send useful items into the workspace.",
    paste: "Paste transcript or notes",
    pasteHelp:
      "Use this for meeting notes, phone call summaries, exported transcripts, or a quick voice-note draft.",
    upload: "Add files",
    uploadHelp:
      "Text files are read locally. Audio/video files are tracked as intake sources for review.",
    demo: "Load example",
    analyze: "Analyze locally",
    copy: "Copy report",
    clear: "Clear",
    queueAll: "Send to Intake Queue",
    queued: "Sent to queue",
    queueItem: "Queue",
    files: "Files",
    noFiles: "No files added.",
    source: "Source type",
    summary: "Local summary",
    actions: "Next actions",
    risks: "Risks / questions",
    decisions: "Decisions",
    nothing: "Add text, add a file, or choose a source example, then run local analysis.",
    localOnly: "Local only",
    localNote: "Review-first intake with no automatic external processing.",
    sourceTypes: [
      "Meeting",
      "Phone call",
      "Voice note",
      "Wearable recorder",
      "Uploaded transcript",
    ],
    devicePanel: "Choose what you want to connect",
    devicePanelHint:
      "Pick a real source, see what can be imported, then load the right intake example.",
    importFormats: "What can arrive",
    setupPath: "How it connects",
    usefulOutput: "What 1inow can prepare",
    useSetup: "Use this setup",
    readyNow: "Ready now",
    planned: "Planned",
  },
  ru: {
    title: "Устройства и разговоры",
    subtitle:
      "Практичный рабочий стол для звонков, встреч, голосовых заметок и транскриптов. Проверяйте контекст, выделяйте решения и отправляйте полезное в рабочее пространство.",
    paste: "Вставьте транскрипт или заметки",
    pasteHelp:
      "Подходит для заметок встречи, саммари звонка, экспортированного транскрипта или быстрой голосовой заметки.",
    upload: "Добавить файлы",
    uploadHelp:
      "Текстовые файлы читаются локально. Аудио/видео отслеживаются как источники для разбора.",
    demo: "Загрузить пример",
    analyze: "Разобрать локально",
    copy: "Скопировать отчет",
    clear: "Очистить",
    queueAll: "Отправить в Intake Queue",
    queued: "Отправлено в очередь",
    queueItem: "В очередь",
    files: "Файлы",
    noFiles: "Файлы не добавлены.",
    source: "Тип источника",
    summary: "Локальное саммари",
    actions: "Следующие действия",
    risks: "Риски / вопросы",
    decisions: "Решения",
    nothing:
      "Добавьте текст, файл или выберите пример источника, затем запустите локальный разбор.",
    localOnly: "Локально",
    localNote: "Intake через ревью без автоматической внешней обработки.",
    sourceTypes: [
      "Встреча",
      "Телефонный разговор",
      "Голосовая заметка",
      "Носимый рекордер",
      "Загруженный транскрипт",
    ],
    devicePanel: "Выберите, что хотите подключить",
    devicePanelHint:
      "Выберите реальный источник, посмотрите что можно импортировать, затем загрузите подходящий пример.",
    importFormats: "Что может поступать",
    setupPath: "Как подключается",
    usefulOutput: "Что 1inow подготовит",
    useSetup: "Использовать этот вариант",
    readyNow: "Готово сейчас",
    planned: "Запланировано",
  },
  uk: {
    title: "Пристрої та розмови",
    subtitle:
      "Практичний робочий стіл для дзвінків, зустрічей, голосових нотаток і транскриптів. Перевіряйте контекст, виділяйте рішення і надсилайте корисне в робочий простір.",
    paste: "Вставте транскрипт або нотатки",
    pasteHelp:
      "Підходить для нотаток зустрічі, summary дзвінка, експортованого транскрипта або швидкої голосової нотатки.",
    upload: "Додати файли",
    uploadHelp:
      "Текстові файли читаються локально. Аудіо/відео відстежуються як джерела для огляду.",
    demo: "Завантажити приклад",
    analyze: "Розібрати локально",
    copy: "Скопіювати звіт",
    clear: "Очистити",
    queueAll: "Надіслати в Intake Queue",
    queued: "Надіслано в чергу",
    queueItem: "У чергу",
    files: "Файли",
    noFiles: "Файли не додані.",
    source: "Тип джерела",
    summary: "Локальне summary",
    actions: "Наступні дії",
    risks: "Ризики / питання",
    decisions: "Рішення",
    nothing: "Додайте текст, файл або оберіть приклад джерела, потім запустіть локальний розбір.",
    localOnly: "Локально",
    localNote: "Intake через огляд без автоматичної зовнішньої обробки.",
    sourceTypes: [
      "Зустріч",
      "Телефонна розмова",
      "Голосова нотатка",
      "Носимий рекордер",
      "Завантажений транскрипт",
    ],
    devicePanel: "Оберіть, що хочете підключити",
    devicePanelHint:
      "Оберіть реальне джерело, перегляньте що можна імпортувати, потім завантажте відповідний приклад.",
    importFormats: "Що може надходити",
    setupPath: "Як підключається",
    usefulOutput: "Що 1inow підготує",
    useSetup: "Використати цей варіант",
    readyNow: "Готово зараз",
    planned: "Заплановано",
  },
  es: {
    title: "Dispositivos y conversaciones",
    subtitle:
      "Mesa práctica para llamadas, reuniones, notas de voz y transcripciones. Revisa contexto, extrae decisiones y envía lo útil al espacio de trabajo.",
    paste: "Pega transcripción o notas",
    pasteHelp:
      "Sirve para notas de reunión, resumen de llamada, transcripción exportada o nota de voz rápida.",
    upload: "Añadir archivos",
    uploadHelp:
      "Los archivos de texto se leen localmente. Audio/video se rastrean como fuentes para revisión.",
    demo: "Cargar ejemplo",
    analyze: "Analizar localmente",
    copy: "Copiar informe",
    clear: "Limpiar",
    queueAll: "Enviar a Intake Queue",
    queued: "Enviado a la cola",
    queueItem: "Cola",
    files: "Archivos",
    noFiles: "No hay archivos.",
    source: "Tipo de fuente",
    summary: "Resumen local",
    actions: "Próximas acciones",
    risks: "Riesgos / preguntas",
    decisions: "Decisiones",
    nothing: "Añade texto, archivo o un ejemplo de fuente y ejecuta el análisis local.",
    localOnly: "Local",
    localNote: "Intake con revisión previa, sin procesamiento externo automático.",
    sourceTypes: ["Reunión", "Llamada", "Nota de voz", "Grabador wearable", "Transcripción subida"],
    devicePanel: "Elige qué quieres conectar",
    devicePanelHint:
      "Elige una fuente real, revisa qué se puede importar y carga el ejemplo correcto.",
    importFormats: "Qué puede entrar",
    setupPath: "Cómo se conecta",
    usefulOutput: "Qué prepara 1inow",
    useSetup: "Usar esta opción",
    readyNow: "Listo ahora",
    planned: "Planificado",
  },
  de: {
    title: "Geräte & Gespräche",
    subtitle:
      "Praktischer Intake für Calls, Meetings, Voice Notes und Transkripte. Kontext prüfen, Entscheidungen extrahieren und Nützliches in den Workspace senden.",
    paste: "Transkript oder Notizen einfügen",
    pasteHelp:
      "Für Meeting-Notizen, Call-Summary, exportierte Transkripte oder schnelle Voice Notes.",
    upload: "Dateien hinzufügen",
    uploadHelp:
      "Textdateien werden lokal gelesen. Audio/Video wird als Intake-Quelle für Review geführt.",
    demo: "Beispiel laden",
    analyze: "Lokal analysieren",
    copy: "Report kopieren",
    clear: "Leeren",
    queueAll: "An Intake Queue senden",
    queued: "In Queue gesendet",
    queueItem: "Queue",
    files: "Dateien",
    noFiles: "Keine Dateien hinzugefügt.",
    source: "Quellentyp",
    summary: "Lokale Zusammenfassung",
    actions: "Nächste Aktionen",
    risks: "Risiken / Fragen",
    decisions: "Entscheidungen",
    nothing: "Text, Datei oder Quellenbeispiel hinzufügen und lokale Analyse starten.",
    localOnly: "Lokal",
    localNote: "Review-first Intake ohne automatische externe Verarbeitung.",
    sourceTypes: [
      "Meeting",
      "Telefonat",
      "Voice Note",
      "Wearable Recorder",
      "Hochgeladenes Transkript",
    ],
    devicePanel: "Wählen, was verbunden werden soll",
    devicePanelHint:
      "Quelle auswählen, Importformate prüfen und ein passendes Intake-Beispiel laden.",
    importFormats: "Was ankommen kann",
    setupPath: "Wie es verbunden wird",
    usefulOutput: "Was 1inow vorbereitet",
    useSetup: "Diese Option nutzen",
    readyNow: "Jetzt bereit",
    planned: "Geplant",
  },
};

const demoText = `Digital Invest weekly call.
Decision: focus portfolio page on real operating companies, not generic cards.
Action: prepare updated screenshots for 1inow projects by Friday.
Action: ask designer to reduce visual noise on public pages.
Risk: auth flow still confuses first-time users.
Question: which device export format should we support first: txt, vtt, srt, or pdf?
Follow up with Michael about priority order tomorrow.`;

type Analysis = {
  summary: string[];
  actions: string[];
  risks: string[];
  decisions: string[];
};

function DevicesPage() {
  const { lang } = useI18n();
  const c = copy[lang as keyof typeof copy] ?? copy.en;
  const [sourceType, setSourceType] = useState(c.sourceTypes[0]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [devicePanelOpen, setDevicePanelOpen] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState("pocket-recorder");

  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const quickSourceTiles = useMemo(
    () => [
      {
        icon: Mic,
        title: "Voice recorder",
        text: "Use for quick thoughts, field notes, calls, and personal reminders.",
        source: c.sourceTypes[2],
        sample:
          "Voice note. Action: call Michael tomorrow about project order. Risk: public page still has too many static blocks. Decision: make device intake useful before adding integrations.",
        tone: "border-teal-500/25 bg-teal-500/10 hover:border-teal-500/45 hover:bg-teal-500/15",
      },
      {
        icon: Headphones,
        title: "Meetings",
        text: "Paste meeting notes and extract decisions, risks, and next moves.",
        source: c.sourceTypes[0],
        sample: demoText,
        tone: "border-blue-500/25 bg-blue-500/10 hover:border-blue-500/45 hover:bg-blue-500/15",
      },
      {
        icon: Watch,
        title: "Wearables",
        text: "Turn short captured thoughts into reviewable project or life signals.",
        source: c.sourceTypes[3],
        sample:
          "Wearable recorder note. Question: should I move renovation tasks into one project? Action: review contractor estimate Friday. Risk: documents are scattered between email and desktop.",
        tone: "border-amber-500/25 bg-amber-500/10 hover:border-amber-500/45 hover:bg-amber-500/15",
      },
      {
        icon: FileText,
        title: "Documents",
        text: "Drop TXT, MD, SRT, or VTT files and review the extracted text locally.",
        source: c.sourceTypes[4],
        sample:
          "Uploaded transcript. Decision: use simple file intake first. Action: support TXT, MD, SRT, and VTT locally. Question: which export format matters most for users?",
        tone: "border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-500/45 hover:bg-emerald-500/15",
      },
    ],
    [c.sourceTypes],
  );
  const deviceProfiles = useMemo(
    () => [
      {
        id: "pocket-recorder",
        icon: Mic,
        title: lang === "ru" ? "Карманный голосовой рекордер" : "Pocket voice recorder",
        subtitle:
          lang === "ru"
            ? "Быстрые мысли, звонки, личные напоминания"
            : "Quick thoughts, calls, personal reminders",
        status: c.readyNow,
        source: c.sourceTypes[2],
        tone: "from-teal-500/18 via-cyan-500/10 to-transparent",
        sample:
          lang === "ru"
            ? "Голосовая заметка. Решение: вынести все реальные проекты в Portfolio. Действие: подготовить обновленные карточки проектов завтра. Риск: пользователь не понимает, где подключать устройства."
            : "Voice note. Decision: move real projects into Portfolio. Action: prepare updated project cards tomorrow. Risk: user cannot see where devices are connected.",
        formats: ["TXT export", "M4A / MP3 file", "Manual transcript"],
        setup: [
          lang === "ru"
            ? "Экспортируйте запись или текст из устройства."
            : "Export recording or text from the device.",
          lang === "ru"
            ? "Загрузите файл или вставьте транскрипт."
            : "Upload the file or paste the transcript.",
          lang === "ru" ? "Запустите локальный разбор." : "Run local analysis.",
        ],
        output: [
          lang === "ru" ? "задачи и напоминания" : "tasks and reminders",
          lang === "ru" ? "риски и вопросы" : "risks and questions",
          lang === "ru" ? "решения из разговора" : "conversation decisions",
        ],
      },
      {
        id: "meeting-app",
        icon: Headphones,
        title: lang === "ru" ? "Приложение записи встреч" : "Meeting capture app",
        subtitle:
          lang === "ru"
            ? "Zoom, Meet, Teams, локальные записи"
            : "Zoom, Meet, Teams, local recordings",
        status: c.readyNow,
        source: c.sourceTypes[0],
        tone: "from-blue-500/18 via-sky-500/10 to-transparent",
        sample: demoText,
        formats: ["VTT / SRT", "TXT / MD", "Meeting notes"],
        setup: [
          lang === "ru"
            ? "Сохраните transcript или meeting notes."
            : "Save transcript or meeting notes.",
          lang === "ru"
            ? "Загрузите VTT/SRT/TXT или вставьте текст."
            : "Upload VTT/SRT/TXT or paste text.",
          lang === "ru"
            ? "Получите действия, решения и риски."
            : "Extract actions, decisions, and risks.",
        ],
        output: [
          lang === "ru" ? "план после встречи" : "post-meeting plan",
          lang === "ru" ? "ответственные и сроки" : "owners and deadlines",
          lang === "ru" ? "открытые вопросы" : "open questions",
        ],
      },
      {
        id: "phone-call",
        icon: Smartphone,
        title: lang === "ru" ? "Телефонный разговор" : "Phone call export",
        subtitle:
          lang === "ru"
            ? "Звонки, переговоры, клиентские разговоры"
            : "Calls, negotiations, client conversations",
        status: c.planned,
        source: c.sourceTypes[1],
        tone: "from-amber-500/20 via-orange-500/10 to-transparent",
        sample:
          lang === "ru"
            ? "Телефонный разговор. Вопрос: подтвердить бюджет и дату запуска. Действие: отправить summary клиенту сегодня. Риск: нет письменного подтверждения условий."
            : "Phone call. Question: confirm budget and launch date. Action: send summary to client today. Risk: no written confirmation of terms.",
        formats: ["Manual notes", "TXT transcript", "Audio source"],
        setup: [
          lang === "ru"
            ? "Сначала вставьте заметки или transcript."
            : "Start by pasting notes or transcript.",
          lang === "ru"
            ? "Аудио-файлы сохраняются как источник для ревью."
            : "Audio files are tracked as review sources.",
          lang === "ru"
            ? "Проверьте итог перед созданием задач."
            : "Review output before creating tasks.",
        ],
        output: [
          lang === "ru" ? "summary звонка" : "call summary",
          lang === "ru" ? "follow-up действия" : "follow-up actions",
          lang === "ru" ? "что нужно уточнить" : "clarification points",
        ],
      },
      {
        id: "wearable",
        icon: Watch,
        title: lang === "ru" ? "Носимый рекордер" : "Wearable recorder",
        subtitle:
          lang === "ru"
            ? "Короткие мысли в дороге, встречи, личные идеи"
            : "Short thoughts, hallway talks, personal ideas",
        status: c.planned,
        source: c.sourceTypes[3],
        tone: "from-emerald-500/18 via-lime-500/10 to-transparent",
        sample:
          lang === "ru"
            ? "Носимый рекордер. Мысль: объединить задачи дома и бизнеса в один обзор дня. Действие: создать список утренних проверок. Риск: слишком много ручного ввода."
            : "Wearable recorder. Thought: combine home and business tasks into one daily review. Action: create morning review checklist. Risk: too much manual input.",
        formats: ["Short transcript", "TXT export", "Audio file later"],
        setup: [
          lang === "ru" ? "Экспортируйте короткую заметку." : "Export a short note.",
          lang === "ru" ? "Вставьте текст или загрузите файл." : "Paste text or upload file.",
          lang === "ru"
            ? "Разделите личное, проектное и срочное."
            : "Separate personal, project, and urgent items.",
        ],
        output: [
          lang === "ru" ? "личные напоминания" : "personal reminders",
          lang === "ru" ? "проектные сигналы" : "project signals",
          lang === "ru" ? "идеи для review" : "review ideas",
        ],
      },
    ],
    [c.planned, c.readyNow, c.sourceTypes, lang],
  );
  const selectedDevice =
    deviceProfiles.find((device) => device.id === selectedDeviceId) ?? deviceProfiles[0];
  const SelectedDeviceIcon = selectedDevice.icon;

  const handleFiles = async (selected: FileList | null) => {
    const incoming = Array.from(selected ?? []);
    setFiles((current) => [...incoming, ...current]);

    const textFiles = incoming.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        file.type.startsWith("text/") ||
        [".txt", ".md", ".srt", ".vtt"].some((ext) => name.endsWith(ext))
      );
    });

    const chunks = await Promise.all(textFiles.map((file) => file.text().catch(() => "")));
    const usefulText = chunks.filter(Boolean).join("\n\n");
    if (usefulText) setText((current) => [current, usefulText].filter(Boolean).join("\n\n"));
  };

  const runAnalysis = () => {
    const effectiveText = text.trim() ? text : selectedDevice.sample;
    if (!text.trim()) setText(effectiveText);
    setAnalysis(analyzeConversation(effectiveText, files, sourceType));
    setCopied(false);
    setQueuedCount(0);
  };

  const clearAll = () => {
    setText("");
    setFiles([]);
    setAnalysis(null);
    setCopied(false);
    setQueuedCount(0);
  };

  const report = analysis ? formatReport(c, sourceType, analysis) : "";

  const copyReport = async () => {
    if (!report) return;
    await navigator.clipboard?.writeText(report);
    setCopied(true);
  };

  const saveItemToQueue = (item: string, kind: VoiceInboxKind) => {
    const saved = saveVoiceInboxItem({
      raw: item,
      title: item,
      kind,
      confidence: kind === "task" ? "high" : "medium",
      summary: `Captured from ${sourceType} on Devices & Conversations.`,
    });
    if (!saved) return;
    setQueuedCount((count) => count + 1);
    toast.success(c.queued);
  };

  const saveAnalysisToQueue = () => {
    if (!analysis) return;
    const items: Array<{ raw: string; kind: VoiceInboxKind }> = [
      ...analysis.actions.map((raw) => ({ raw, kind: "task" as const })),
      ...analysis.risks.map((raw) => ({ raw, kind: "risk" as const })),
      ...analysis.decisions.map((raw) => ({ raw, kind: "note" as const })),
      ...analysis.summary.map((raw) => ({ raw, kind: "note" as const })),
    ];
    let saved = 0;
    for (const item of items) {
      if (
        saveVoiceInboxItem({
          raw: item.raw,
          title: item.raw,
          kind: item.kind,
          confidence: item.kind === "task" ? "high" : "medium",
          summary: `Captured from ${sourceType} on Devices & Conversations.`,
        })
      ) {
        saved += 1;
      }
    }
    setQueuedCount((count) => count + saved);
    toast.success(`${saved} ${c.queued.toLowerCase()}`);
  };

  return (
    <PageContainer size="wide">
      <SectionHeader
        title={c.title}
        description={c.subtitle}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <ShieldCheck className="size-3.5 text-accent" />
            {c.localOnly}
          </Badge>
        }
      />

      <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-900 dark:text-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{c.localNote}</span>
        </div>
      </div>

      <SafeCard className="mb-5 overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setDevicePanelOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 border-b border-border/70 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-amber-500/10 px-5 py-4 text-left"
        >
          <div>
            <div className="text-base font-semibold">{c.devicePanel}</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.devicePanelHint}</p>
          </div>
          <ChevronDown
            className={`size-5 shrink-0 text-muted-foreground transition-transform ${devicePanelOpen ? "rotate-180" : ""}`}
          />
        </button>

        {devicePanelOpen && (
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-border/70 p-4 lg:border-b-0 lg:border-r">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {deviceProfiles.map((device) => {
                  const Icon = device.icon;
                  const active = selectedDevice.id === device.id;
                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => setSelectedDeviceId(device.id)}
                      className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                        active
                          ? "border-accent/55 bg-accent/10 shadow-sm"
                          : "border-border bg-background/70 hover:border-accent/35"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${device.tone} text-accent`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold leading-5">{device.title}</h3>
                            <Badge
                              variant={device.status === c.readyNow ? "secondary" : "outline"}
                              className="shrink-0"
                            >
                              {device.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {device.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`bg-gradient-to-br ${selectedDevice.tone} p-5`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {selectedDevice.status}
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    {selectedDevice.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {selectedDevice.subtitle}
                  </p>
                </div>
                <div className="hidden size-16 place-items-center rounded-3xl bg-background/70 text-accent shadow-sm md:grid">
                  <SelectedDeviceIcon className="size-7" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <DeviceDetail title={c.importFormats} items={selectedDevice.formats} />
                <DeviceDetail title={c.setupPath} items={selectedDevice.setup} />
                <DeviceDetail title={c.usefulOutput} items={selectedDevice.output} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setSourceType(selectedDevice.source);
                    setText(selectedDevice.sample);
                    setAnalysis(null);
                    setCopied(false);
                  }}
                  className="gap-2"
                >
                  <SelectedDeviceIcon className="size-4" />
                  {c.useSetup}
                </Button>
                <Button type="button" variant="outline" onClick={runAnalysis}>
                  {c.analyze}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SafeCard>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_0.75fr]">
        <SafeCard className="space-y-5">
          <div>
            <div className="mb-2 text-sm font-semibold">{c.source}</div>
            <div className="flex flex-wrap gap-2">
              {c.sourceTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSourceType(type)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    sourceType === type
                      ? "border-accent/50 bg-accent/15 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr]">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{c.paste}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.pasteHelp}</p>
                </div>
                <Badge variant="secondary">{wordCount} words</Badge>
              </div>
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="min-h-80 resize-y rounded-2xl text-sm leading-6"
                placeholder={demoText}
              />
            </div>

            <div className="space-y-4">
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-accent/35 bg-accent/5 p-5 text-center transition-colors hover:bg-accent/10">
                <UploadCloud className="mb-3 size-9 text-accent" />
                <span className="text-sm font-semibold">{c.upload}</span>
                <span className="mt-2 text-xs leading-5 text-muted-foreground">{c.uploadHelp}</span>
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  accept="audio/*,video/*,.txt,.md,.pdf,.doc,.docx,.srt,.vtt"
                  onChange={(event) => void handleFiles(event.target.files)}
                />
              </label>

              <SafeCard className="bg-background/70">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <FileAudio className="size-4 text-accent" />
                  {c.files}
                </div>
                <div className="space-y-2">
                  {files.length ? (
                    files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs"
                      >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <span className="text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{c.noFiles}</p>
                  )}
                </div>
              </SafeCard>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setText(demoText)}
              className="gap-2"
              variant="outline"
            >
              <ClipboardList className="size-4" />
              {c.demo}
            </Button>
            <Button type="button" onClick={runAnalysis} className="gap-2">
              <ListChecks className="size-4" />
              {c.analyze}
            </Button>
            {analysis ? (
              <>
                <Button type="button" onClick={copyReport} variant="outline" className="gap-2">
                  <Clipboard className="size-4" />
                  {copied ? "Copied" : c.copy}
                </Button>
                <Button
                  type="button"
                  onClick={saveAnalysisToQueue}
                  variant="outline"
                  className="gap-2"
                >
                  <Inbox className="size-4" />
                  {queuedCount ? `${queuedCount} ${c.queued}` : c.queueAll}
                </Button>
              </>
            ) : null}
            <Button type="button" onClick={clearAll} variant="ghost" className="gap-2">
              <Trash2 className="size-4" />
              {c.clear}
            </Button>
          </div>
        </SafeCard>

        <SafeCard className="space-y-4">
          {analysis ? (
            <>
              <ResultBlock
                icon={ClipboardList}
                title={c.summary}
                items={analysis.summary}
                kind="note"
                queueLabel={c.queueItem}
                onQueue={saveItemToQueue}
                tone="border-teal-500/25 bg-teal-500/5"
              />
              <ResultBlock
                icon={CheckCircle2}
                title={c.actions}
                items={analysis.actions}
                kind="task"
                queueLabel={c.queueItem}
                onQueue={saveItemToQueue}
                tone="border-emerald-500/25 bg-emerald-500/5"
              />
              <ResultBlock
                icon={AlertTriangle}
                title={c.risks}
                items={analysis.risks}
                kind="risk"
                queueLabel={c.queueItem}
                onQueue={saveItemToQueue}
                tone="border-amber-500/25 bg-amber-500/5"
              />
              <ResultBlock
                icon={ShieldCheck}
                title={c.decisions}
                items={analysis.decisions}
                kind="note"
                queueLabel={c.queueItem}
                onQueue={saveItemToQueue}
                tone="border-blue-500/25 bg-blue-500/5"
              />
            </>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 p-8 text-center">
              <Mic className="mb-4 size-11 text-accent" />
              <h2 className="text-lg font-semibold">{c.nothing}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{c.pasteHelp}</p>
            </div>
          )}
        </SafeCard>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {quickSourceTiles.map((tile) => (
          <InfoTile
            key={tile.title}
            icon={tile.icon}
            title={tile.title}
            text={tile.text}
            active={sourceType === tile.source}
            tone={tile.tone}
            onClick={() => {
              setSourceType(tile.source);
              setText(tile.sample);
              setAnalysis(null);
              setCopied(false);
            }}
          />
        ))}
      </div>
    </PageContainer>
  );
}

function analyzeConversation(text: string, files: File[], sourceType: string): Analysis {
  const lines = text
    .split(/\n|\.|;|•|-/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3);

  const lower = (value: string) => value.toLowerCase();
  const find = (patterns: RegExp[]) =>
    unique(lines.filter((line) => patterns.some((pattern) => pattern.test(lower(line))))).slice(
      0,
      6,
    );

  const actions = find([
    /action|todo|follow|prepare|send|call|ask|review|create|update|fix|next/,
    /сдел|подготов|отправ|позвон|спрос|провер|обнов|след/,
    /дія|підгот|надісл|подзвон|запит|перевір|онов/,
  ]);
  const risks = find([
    /risk|blocked|issue|problem|unclear|question|concern|confus|delay/,
    /риск|проблем|неяс|вопрос|блок|задерж|пута/,
    /ризик|проблем|неяс|питання|блок|затрим/,
  ]);
  const decisions = find([
    /decision|decided|approve|approved|choose|chosen|confirm/,
    /решен|утверд|выбр|подтверд/,
    /рішен|затверд|обра|підтверд/,
  ]);

  const summarySeeds = unique([...decisions, ...actions, ...risks, ...lines.slice(0, 3)]).slice(
    0,
    4,
  );

  const summary = summarySeeds.length
    ? summarySeeds
    : [
        files.length
          ? `${files.length} file(s) added for ${sourceType}. Text extraction is available for text-based files.`
          : `No clear action language found yet for ${sourceType}. Add more notes or load an example.`,
      ];

  return {
    summary,
    actions: actions.length
      ? actions
      : ["No explicit next actions found. Add owner/date words to improve local extraction."],
    risks: risks.length ? risks : ["No clear risk or question found."],
    decisions: decisions.length ? decisions : ["No explicit decision found."],
  };
}

function ResultBlock({
  icon: Icon,
  title,
  items,
  kind,
  queueLabel,
  onQueue,
  tone,
}: {
  icon: typeof Mic;
  title: string;
  items: string[];
  kind: VoiceInboxKind;
  queueLabel: string;
  onQueue: (item: string, kind: VoiceInboxKind) => void;
  tone: string;
}) {
  return (
    <section className={`rounded-2xl border p-4 ${tone}`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-accent" />
        {title}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-border bg-card/80 px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-accent/45 hover:bg-accent/10 hover:shadow-sm"
          >
            <div className="text-sm leading-6">{item}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(item)}
                className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/45 hover:text-foreground"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => onQueue(item, kind)}
                className="rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
              >
                {queueLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeviceDetail({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/75 p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-5">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  title,
  text,
  active,
  tone,
  onClick,
}: {
  icon: typeof Mic;
  title: string;
  text: string;
  active: boolean;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-40 rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5 ${tone} ${
        active ? "ring-2 ring-accent/35" : ""
      }`}
    >
      <div className="mb-4 grid size-10 place-items-center rounded-2xl bg-background/75 text-accent transition-transform group-hover:scale-105">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      <span className="mt-4 inline-flex text-xs font-semibold text-accent">Use this flow →</span>
    </button>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatReport(c: (typeof copy)["en"], sourceType: string, analysis: Analysis) {
  return [
    `Source: ${sourceType}`,
    "",
    `${c.summary}:`,
    ...analysis.summary.map((item) => `- ${item}`),
    "",
    `${c.actions}:`,
    ...analysis.actions.map((item) => `- ${item}`),
    "",
    `${c.risks}:`,
    ...analysis.risks.map((item) => `- ${item}`),
    "",
    `${c.decisions}:`,
    ...analysis.decisions.map((item) => `- ${item}`),
  ].join("\n");
}
