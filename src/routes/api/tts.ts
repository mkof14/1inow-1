import { createFileRoute } from "@tanstack/react-router";

type Body = { text?: string; voice?: string; lang?: string };

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, voice } = (await request.json()) as Body;
        void voice;
        if (!text || !text.trim()) return new Response("text required", { status: 400 });

        return Response.json(
          { message: "Text-to-speech service is not connected yet.", disabled: true },
          { status: 501, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
