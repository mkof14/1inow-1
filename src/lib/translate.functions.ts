import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

type Input = { text: string; targetLang: string; sourceLang?: string; tone?: string };

const LANG_NAME: Record<string, string> = {
  en: "English", uk: "Ukrainian", ru: "Russian",
  de: "German", fr: "French", es: "Spanish", it: "Italian", pl: "Polish",
};

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const i = d as Input;
    if (!i?.text || !i?.targetLang) throw new Error("text and targetLang required");
    if (i.text.length > 12000) throw new Error("Text too long");
    return i;
  })
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const target = LANG_NAME[data.targetLang] ?? data.targetLang;
    const source = data.sourceLang ? (LANG_NAME[data.sourceLang] ?? data.sourceLang) : "the source language";
    const tone = data.tone ? ` Use a ${data.tone} tone.` : "";

    // Translation memory lookup
    const hash = await sha256(`${data.sourceLang ?? "auto"}::${data.text}`);
    const { supabase } = context;
    const { data: memo } = await supabase
      .from("translation_memory")
      .select("target_text")
      .eq("source_hash", hash)
      .eq("target_language", data.targetLang)
      .maybeSingle();
    if (memo?.target_text) {
      await supabase.from("translation_memory")
        .update({ use_count: 1 })
        .eq("source_hash", hash).eq("target_language", data.targetLang);
      return { text: memo.target_text, cached: true };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `You are a professional translator. Translate the user's text from ${source} into ${target}. Preserve formatting (markdown, lists, code blocks), mentions (@name), links, and structure exactly.${tone} Output ONLY the translated text — no preamble, no explanation.`,
      prompt: data.text,
    });

    await supabase.from("translation_memory").insert({
      source_hash: hash,
      source_language: data.sourceLang ?? "auto",
      target_language: data.targetLang,
      source_text: data.text,
      target_text: text,
      created_by: context.userId,
    });

    return { text, cached: false };
  });

async function sha256(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// AI Language Assistant: rewrite/improve with tone
type RewriteInput = { text: string; mode: "improve" | "simplify" | "professional" | "executive" | "legal" | "technical" | "marketing"; lang?: string };

export const rewriteText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const i = d as RewriteInput;
    if (!i?.text || !i?.mode) throw new Error("text and mode required");
    return i;
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const instructions: Record<string, string> = {
      improve: "Improve clarity, grammar, and flow while preserving meaning.",
      simplify: "Simplify so a non-expert can understand. Short sentences.",
      professional: "Rewrite in a polished, professional business tone.",
      executive: "Rewrite for a C-level executive: concise, decisive, outcome-oriented.",
      legal: "Rewrite in formal legal tone with precise terminology.",
      technical: "Rewrite in clear technical documentation tone.",
      marketing: "Rewrite in engaging marketing tone — vivid, benefit-driven.",
    };
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `You are a professional editor. ${instructions[data.mode]} Preserve formatting (markdown, mentions, links). Output ONLY the rewritten text${data.lang ? ` in ${LANG_NAME[data.lang] ?? data.lang}` : ""}.`,
      prompt: data.text,
    });
    return { text };
  });