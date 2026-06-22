import { createFileRoute } from "@tanstack/react-router";
import { getTtsProviderState } from "@/lib/connection-providers.server";

type Body = { text?: string; voice?: string; lang?: string };

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, voice, lang } = (await request.json()) as Body;
        void voice;
        void lang;
        if (!text || !text.trim()) return new Response("text required", { status: 400 });

        const service = getTtsProviderState();

        return Response.json(
          {
            message: service.message,
            disabled: service.disabled,
            provider: service.provider,
            status: service.status,
            capabilities: service.capabilities,
            nextStep: service.nextStep,
          },
          { status: 501, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
