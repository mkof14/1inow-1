import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Cable,
  CheckCircle2,
  FileAudio,
  FileText,
  Headphones,
  Mic,
  UploadCloud,
  Watch,
} from "lucide-react";
import { PageContainer, SectionHeader, ResponsiveGrid, SafeCard } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/devices")({
  component: DevicesPage,
});

const copy = {
  en: {
    title: "Devices & Conversations",
    subtitle:
      "Bring real conversations into 1inow: meeting recordings, phone calls, voice recorder files, and future device integrations.",
    upload: "Upload conversation files",
    uploadHelp:
      "Select audio, video, transcript, or meeting notes. Files stay local in this prototype. Transcription and AI summary are not connected yet.",
    choose: "Choose files",
    queue: "Conversation intake queue",
    empty: "No files selected yet.",
    disabled: "Summary pipeline prepared. AI/STT providers are intentionally disabled.",
    pipeline: ["Import", "Transcribe later", "Summarize", "Extract tasks", "Attach to projects"],
    devicesTitle: "Device connection targets",
    notesTitle: "How Nova and Vera will use this",
    notes: [
      "Nova extracts next actions, reminders, project updates, and follow-ups.",
      "Vera highlights risks, unclear decisions, sensitive topics, and questions to ask you.",
      "The system should never act on imported conversations without review and confirmation.",
    ],
  },
  ru: {
    title: "Устройства и разговоры",
    subtitle:
      "Заводите реальные разговоры в 1inow: записи встреч, телефонные разговоры, файлы диктофонов и будущие интеграции устройств.",
    upload: "Upload разговоров",
    uploadHelp:
      "Выберите аудио, видео, транскрипт или заметки встречи. В прототипе файлы остаются локально. Транскрибация и AI-саммари пока не подключены.",
    choose: "Выбрать файлы",
    queue: "Очередь разговоров",
    empty: "Файлы пока не выбраны.",
    disabled: "Пайплайн саммари подготовлен. AI/STT провайдеры намеренно отключены.",
    pipeline: ["Импорт", "Транскрибация позже", "Саммари", "Задачи", "Привязка к проектам"],
    devicesTitle: "Целевые подключения устройств",
    notesTitle: "Как Nova и Vera будут использовать это",
    notes: [
      "Nova выделяет следующие действия, напоминания, обновления проектов и follow-up.",
      "Vera подсвечивает риски, неясные решения, чувствительные темы и вопросы, которые нужно уточнить.",
      "Система не должна действовать по импортированным разговорам без проверки и подтверждения.",
    ],
  },
  uk: {
    title: "Пристрої та розмови",
    subtitle:
      "Заводьте реальні розмови в 1inow: записи зустрічей, телефонні дзвінки, файли диктофонів і майбутні інтеграції пристроїв.",
    upload: "Upload розмов",
    uploadHelp:
      "Оберіть аудіо, відео, транскрипт або нотатки зустрічі. У прототипі файли залишаються локально. Транскрибація та AI-summary поки не підключені.",
    choose: "Обрати файли",
    queue: "Черга розмов",
    empty: "Файли ще не вибрані.",
    disabled: "Пайплайн summary підготовлений. AI/STT провайдери навмисно вимкнені.",
    pipeline: ["Імпорт", "Транскрибація пізніше", "Summary", "Задачі", "Прив'язка до проєктів"],
    devicesTitle: "Цільові підключення пристроїв",
    notesTitle: "Як Nova і Vera будуть це використовувати",
    notes: [
      "Nova виділяє наступні дії, нагадування, оновлення проєктів і follow-up.",
      "Vera підсвічує ризики, неясні рішення, чутливі теми і питання для уточнення.",
      "Система не має діяти за імпортованими розмовами без перевірки і підтвердження.",
    ],
  },
  es: {
    title: "Dispositivos y conversaciones",
    subtitle:
      "Lleva conversaciones reales a 1inow: grabaciones de reuniones, llamadas, archivos de grabadoras y futuras integraciones.",
    upload: "Subir conversaciones",
    uploadHelp:
      "Selecciona audio, video, transcripción o notas. En este prototipo los archivos quedan locales. Transcripción y resumen AI aún no están conectados.",
    choose: "Elegir archivos",
    queue: "Cola de conversaciones",
    empty: "Aún no hay archivos seleccionados.",
    disabled: "Pipeline de resumen preparado. Proveedores AI/STT desactivados intencionalmente.",
    pipeline: [
      "Importar",
      "Transcribir luego",
      "Resumir",
      "Extraer tareas",
      "Conectar a proyectos",
    ],
    devicesTitle: "Dispositivos objetivo",
    notesTitle: "Cómo lo usarán Nova y Vera",
    notes: [
      "Nova extrae acciones, recordatorios, actualizaciones de proyecto y follow-up.",
      "Vera destaca riesgos, decisiones poco claras, temas sensibles y preguntas para aclarar.",
      "El sistema no debe actuar sobre conversaciones importadas sin revisión y confirmación.",
    ],
  },
  de: {
    title: "Geräte & Gespräche",
    subtitle:
      "Bringe echte Gespräche in 1inow: Meeting-Aufnahmen, Telefonate, Recorder-Dateien und künftige Geräteintegrationen.",
    upload: "Gespräche hochladen",
    uploadHelp:
      "Wähle Audio, Video, Transkript oder Meeting-Notizen. Im Prototyp bleiben Dateien lokal. Transkription und AI-Zusammenfassung sind noch nicht verbunden.",
    choose: "Dateien wählen",
    queue: "Gesprächs-Queue",
    empty: "Noch keine Dateien ausgewählt.",
    disabled: "Summary-Pipeline vorbereitet. AI/STT Provider sind bewusst deaktiviert.",
    pipeline: [
      "Import",
      "Später transkribieren",
      "Zusammenfassen",
      "Aufgaben extrahieren",
      "Projekten zuordnen",
    ],
    devicesTitle: "Zielgeräte",
    notesTitle: "Wie Nova und Vera das nutzen",
    notes: [
      "Nova extrahiert nächste Aktionen, Erinnerungen, Projektupdates und Follow-ups.",
      "Vera markiert Risiken, unklare Entscheidungen, sensible Themen und Rückfragen.",
      "Das System soll aus importierten Gesprächen nie ohne Prüfung und Bestätigung handeln.",
    ],
  },
};

const deviceTargets = [
  {
    name: "PLAUD Note / NotePin / Note Pro",
    type: "AI recorder",
    status: "File/API planning",
    icon: Mic,
    note: "Primary target for voice notes, meetings, and call recording exports.",
  },
  {
    name: "PLAUD Desktop",
    type: "Meeting capture",
    status: "Meeting import planning",
    icon: Headphones,
    note: "Useful for Zoom, Google Meet, Microsoft Teams, and local meeting recordings.",
  },
  {
    name: "Mobvoi TicNote / AI recorder watches",
    type: "Wearable recorder",
    status: "Export planning",
    icon: Watch,
    note: "Watch and wearable recorders can feed quick personal/business conversations.",
  },
  {
    name: "Bee, Limitless, Soundcore Work",
    type: "Ambient AI devices",
    status: "Future review",
    icon: Cable,
    note: "Category to monitor for export, consent, privacy, and enterprise controls.",
  },
];

function DevicesPage() {
  const { lang } = useI18n();
  const c = copy[lang as keyof typeof copy] ?? copy.en;
  const [files, setFiles] = useState<File[]>([]);
  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  return (
    <PageContainer size="wide">
      <SectionHeader
        title={c.title}
        description={c.subtitle}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-500" />
            Safe stub
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.92fr_0.58fr]">
        <SafeCard className="relative overflow-hidden p-0">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-sky-400 to-amber-300" />
          <div className="grid gap-4 p-5 md:grid-cols-[0.9fr_1.1fr]">
            <label className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-accent/35 bg-accent/5 p-6 text-center transition-colors hover:bg-accent/10">
              <UploadCloud className="mb-4 size-12 text-accent" />
              <div className="text-lg font-semibold">{c.upload}</div>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {c.uploadHelp}
              </p>
              <Button type="button" className="mt-5 pointer-events-none">
                {c.choose}
              </Button>
              <input
                type="file"
                multiple
                className="sr-only"
                accept="audio/*,video/*,.txt,.md,.doc,.docx,.pdf,.srt,.vtt"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{c.queue}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {files.length} files · {(totalSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <FileAudio className="size-5 text-accent" />
              </div>
              <div className="mt-4 space-y-2">
                {files.length ? (
                  files.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "file"}
                        </div>
                      </div>
                      <Badge variant="secondary">local</Badge>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                    {c.empty}
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                {c.disabled}
              </div>
            </div>
          </div>
        </SafeCard>

        <SafeCard className="surface-aurora shimmer-border">
          <div className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Brain className="size-5 text-accent" />
            {c.notesTitle}
          </div>
          <div className="space-y-3">
            {c.notes.map((note) => (
              <div key={note} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-accent" />
                <span>{note}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2">
            {c.pipeline.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm"
              >
                <span className="grid size-7 place-items-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </SafeCard>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Cable className="size-4" />
          {c.devicesTitle}
        </div>
        <ResponsiveGrid min={250}>
          {deviceTargets.map((device) => {
            const Icon = device.icon;
            return (
              <SafeCard key={device.name} className="relative min-h-48">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline">{device.status}</Badge>
                </div>
                <h2 className="text-base font-semibold">{device.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {device.type}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{device.note}</p>
              </SafeCard>
            );
          })}
        </ResponsiveGrid>
      </section>
    </PageContainer>
  );
}
