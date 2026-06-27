/** Bridge Sense advice → executable workspace actions (Phase 12). */

export type AdviceContext = {
  senseReply: string;
  summary?: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:«»"'`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ADVICE_ACTION_RES = [
  /\b(?:create|make|add)\s+(?:a\s+)?task\s+from\s+(?:this|that|it|advice|sense|the answer)\b/i,
  /\bmake\s+(?:this|it|that)\s+(?:a\s+)?task\b/i,
  /\b(?:execute|run|do)\s+(?:the\s+)?(?:first|next)\s+step\b/i,
  /\b(?:создай|добавь|сделай)\s+(?:задачу\s+)?из\s+(?:этого|совета|ответа)\b/i,
  /\b(?:сделай|переведи)\s+(?:это\s+)?(?:в\s+)?задач(?:у|ей)\b/i,
  /\b(?:выполни|сделай)\s+(?:первый|следующий)\s+шаг\b/i,
  /\b(?:створи|додай)\s+(?:задачу\s+)?з\s+(?:цього|поради|відповіді)\b/i,
  /\b(?:crear|hacer)\s+(?:una\s+)?tarea\s+(?:de\s+)?(?:esto|consejo)\b/i,
  /\b(?:aufgabe\s+)?(?:aus\s+diesem|daraus)\s+(?:machen|erstellen)\b/i,
];

export function isAdviceActionPhrase(raw: string) {
  const lower = normalize(raw);
  return ADVICE_ACTION_RES.some((re) => re.test(lower));
}

function cleanTaskTitle(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim()
    .slice(0, 160);
}

/** Pull the first actionable line from a Sense reply (next steps, Nova, bullets). */
export function extractTaskFromAdvice(text: string): string | null {
  const source = text.trim();
  if (!source) return null;

  const nextBlock = source.match(
    /(?:Next steps?|Дальше|Siguientes pasos|Nächste Schritte)\s*:?\s*([\s\S]*?)(?:\n\n|$)/i,
  );
  if (nextBlock?.[1]) {
    const bullet = nextBlock[1].match(/[-•*]\s*(.+)/);
    if (bullet?.[1]) {
      const title = cleanTaskTitle(bullet[1]);
      if (title.length >= 3) return title;
    }
  }

  const nova = source.match(/(?:^|\n)\**Nova\**:?\s*(.+)/im);
  if (nova?.[1]) {
    const sentence = nova[1].split(/[.!?…]/)[0]?.trim();
    if (sentence && sentence.length >= 5) return cleanTaskTitle(sentence);
  }

  const numbered = source.match(/^\s*1[.)]\s*(.+)$/m);
  if (numbered?.[1]) {
    const title = cleanTaskTitle(numbered[1]);
    if (title.length >= 3) return title;
  }

  const bullet = source.match(/^\s*[-•*]\s*(.+)$/m);
  if (bullet?.[1]) {
    const title = cleanTaskTitle(bullet[1]);
    if (title.length >= 5) return title;
  }

  const firstLine = source
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 8 && !/^nova:|^vera:/i.test(l));
  if (firstLine) return cleanTaskTitle(firstLine);

  return null;
}

export function planFromAdviceContext(ctx: AdviceContext, lang: string) {
  const title = extractTaskFromAdvice(ctx.senseReply);
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  if (!title) {
    return {
      ok: false as const,
      question: ru
        ? "Не вижу конкретного шага в последнем ответе Sense. Назовите задачу."
        : "No clear step in the last Sense reply. Say the task title.",
    };
  }
  return {
    ok: true as const,
    title,
    summary: ru ? `Задача из совета: «${title}»` : `Task from advice: ${title}`,
  };
}
