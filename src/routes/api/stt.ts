import { createFileRoute } from "@tanstack/react-router";
import { runSttGateway } from "@/lib/voice-gateway.server";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const file = form.get("file");
        if (!file || !(file instanceof Blob)) {
          return new Response("file required (multipart/form-data)", { status: 400 });
        }

        const language = form.get("language");
        const result = await runSttGateway({
          file,
          filename: file instanceof File ? file.name : "audio.webm",
          language: typeof language === "string" ? language : null,
          authorizationHeader: request.headers.get("authorization"),
        });

        if (!result.ok) {
          return Response.json(result.body, { status: result.status });
        }

        return Response.json({ text: result.text });
      },
    },
  },
});
