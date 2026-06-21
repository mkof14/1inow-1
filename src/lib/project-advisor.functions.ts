import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { projectId: string; prompt: string; lang?: string };

export const askProjectAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const i = d as Input;
    if (!i?.projectId) throw new Error("projectId required");
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
