/** Voice control utterances — barge-in, cancel, confirm (multilingual). */

export type VoiceControlAction = "stop" | "cancel" | "confirm" | "repeat" | "repeat_command" | "undo";

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

const UNDO = [
  "undo",
  "undo that",
  "undo it",
  "take it back",
];

const REPEAT_COMMAND = [
  "repeat last command",
  "run again",
  "run last command",
  "do that again",
  "повтори команду",
  "повтори последнюю команду",
  "ещё раз команда",
  "еще раз команда",
  "повтори останню команду",
  "repite el comando",
  "repetir comando",
  "letzten befehl wiederholen",
  "befehl wiederholen",
];

const REPEAT = [
  "repeat",
  "say again",
  "say that again",
  "once more",
  "what did you say",
  "again",
  "повтори",
  "повтор",
  "ещё раз",
  "еще раз",
  "что ты сказал",
  "повтори еще раз",
  "повтори ещё раз",
  "повтори снова",
  "повтори ще раз",
  "ще раз",
  "repite",
  "otra vez",
  "wiederhol",
  "nochmal",
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
  if (matchesPhrase(n, REPEAT_COMMAND)) return "repeat_command";
  if (matchesPhrase(n, UNDO)) return "undo";
  if (matchesPhrase(n, REPEAT)) return "repeat";
  if (matchesPhrase(n, CANCEL)) return "cancel";
  if (matchesPhrase(n, CONFIRM)) return "confirm";
  return null;
}

export function isVoiceControlPhrase(text: string) {
  return detectVoiceControl(text) !== null;
}

export function isStopPhrase(text: string) {
  return detectVoiceControl(text) === "stop";
}

export function isConfirmPhrase(text: string) {
  return detectVoiceControl(text) === "confirm";
}
