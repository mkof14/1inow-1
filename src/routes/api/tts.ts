import { createFileRoute } from "@tanstack/react-router";
import { runTtsGateway } from "@/lib/voice-gateway.server";

type Body = { text?: string; voice?: string; lang?: string };

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, voice, lang } = (await request.json()) as Body;
        if (!text || !text.trim()) return new Response("text required", { status: 400 });

        const result = await runTtsGateway({
          text: text.trim(),
          voice,
          lang,
          authorizationHeader: request.headers.get("authorization"),
        });

        if (!result.ok) {
          return Response.json(result.body, {
            status: result.status,
            headers: { "Cache-Control": "no-store" },
          });
        }

        return new Response(result.audio, {
          status: 200,
          headers: {
            "Content-Type": result.contentType,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
