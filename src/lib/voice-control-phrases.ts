/** Voice control utterances — barge-in, cancel, confirm (multilingual). */

export type VoiceControlAction = "stop" | "cancel" | "confirm" | "repeat";

const STOP = [
  "stop",
  "stop speaking",
  "be quiet",
  "quiet",
  "silence",
  "shut up",
  "hold on",
  "wait",
  "стоп",
  "остановись",
  "останови",
  "замолчи",
  "замолчать",
  "тише",
  "подожди",
  "стой",
  "хватит",
  "зупини",
  "замовкни",
  "тиша",
  "parar",
  "cállate",
  "silencio",
  "stop",
  "halt",
  "schweig",
  "ruhig",
];

const CONFIRM = [
  "yes",
  "yeah",
  "confirm",
  "do it",
  "go ahead",
  "execute",
  "run it",
  "да",
  "давай",
  "выполни",
  "подтверждаю",
  "ок",
  "окей",
  "так",
  "si",
  "sí",
  "ja",
  "mach",
];

const CANCEL = [
  "cancel",
  "never mind",
  "forget it",
  "no",
  "отмена",
  "отмени",
  "не надо",
  "нет",
  "скасувати",
  "cancelar",
  "abbrechen",
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesPhrase(text: string, phrases: string[]) {
  const n = normalize(text);
  if (!n) return false;
  return phrases.some((p) => n === p || n.startsWith(`${p} `) || n.endsWith(` ${p}`) || n.includes(` ${p} `));
}

export function detectVoiceControl(text: string): VoiceControlAction | null {
  const n = normalize(text);
  if (!n) return null;
  if (matchesPhrase(n, STOP)) return "stop";
  if (matchesPhrase(n, CONFIRM)) return "confirm";
  if (matchesPhrase(n, CANCEL)) return "cancel";
  return null;
}

export function isStopPhrase(text: string) {
  return detectVoiceControl(text) === "stop";
}

export function isConfirmPhrase(text: string) {
  return detectVoiceControl(text) === "confirm";
}
