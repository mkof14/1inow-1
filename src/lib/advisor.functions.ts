import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { runChatGateway } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { prompt: string; lang?: string };

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const i = d as Input;
    if (!i?.prompt) throw new Error("prompt required");
    if (i.prompt.length > 4000) throw new Error("prompt too long");
    return i;
  })
  .handler(async ({ data }) => {
    const request = getRequest();
    const result = await runChatGateway({
      prompt: data.prompt,
      lang: data.lang ?? "en",
      pageContext: { scope: "portfolio_advisor", route: "/ai" },
      authorizationHeader: request?.headers.get("authorization") ?? null,
    });
    return {
      text: result.text,
      disabled: false,
      provider: result.provider,
      mode: result.mode,
    };
  });
