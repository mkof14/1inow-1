import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { text: string; targetLang: string; sourceLang?: string; tone?: string };

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const i = d as Input;
    if (!i?.text || !i?.targetLang) throw new Error("text and targetLang required");
    if (i.text.length > 12000) throw new Error("Text too long");
    return i;
  })
  .handler(async () => {
    return {
      text: "Translation service is not connected yet.",
      cached: false,
      disabled: true,
    };
  });

// AI Language Assistant: rewrite/improve with tone
type RewriteInput = { text: string; mode: "improve" | "simplify" | "professional" | "executive" | "legal" | "technical" | "marketing"; lang?: string };

export const rewriteText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const i = d as RewriteInput;
    if (!i?.text || !i?.mode) throw new Error("text and mode required");
    return i;
  })
  .handler(async () => {
    return {
      text: "Rewrite service is not connected yet.",
      disabled: true,
    };
  });
