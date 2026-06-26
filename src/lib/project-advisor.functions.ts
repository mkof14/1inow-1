import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { runChatGateway } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { projectId: string; prompt: string; lang?: string };

export const askProjectAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const i = d as Input;
    if (!i?.projectId) throw new Error("projectId required");
    if (!i?.prompt) throw new Error("prompt required");
    if (i.prompt.length > 4000) throw new Error("prompt too long");
    return i;
  })
  .handler(async ({ data }) => {
    const request = getRequest();
    const result = await runChatGateway({
      prompt: data.prompt,
      lang: data.lang ?? "en",
      pageContext: {
        scope: "project_advisor",
        route: "/projects",
        ids: { projectId: data.projectId },
      },
      authorizationHeader: request?.headers.get("authorization") ?? null,
    });
    return {
      text: result.text,
      disabled: false,
      provider: result.provider,
      mode: result.mode,
    };
  });
