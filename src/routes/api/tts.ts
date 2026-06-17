import { createFileRoute } from "@tanstack/react-router";

type Body = { text?: string; voice?: string; lang?: string };

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const { text, voice } = (await request.json()) as Body;
        if (!text || !text.trim()) return new Response("text required", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            "Lovable-API-Key": key,
            "Content-Type": "application/json",
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text.slice(0, 4000),
            voice: voice || "alloy",
            instructions:
              "Speak in a warm, natural, human voice. Auto-detect the language of the input and pronounce it natively with appropriate accent and intonation.",
          }),
        });

        if (!upstream.ok) {
          const err = await upstream.text().catch(() => "");
          return new Response(err || `TTS failed: ${upstream.status}`, { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") || "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});