import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { prompt: string; lang?: string };

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const i = d as Input;
    if (!i?.prompt) throw new Error("prompt required");
    if (i.prompt.length > 4000) throw new Error("prompt too long");
    return i;
  })
  .handler(async () => {
    return {
      text: "AI service is not connected yet.",
      disabled: true,
    };
  });
