import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        const language = (form.get("language") as string) || "";
        const model = (form.get("model") as string) || "openai/gpt-4o-mini-transcribe";
        if (!file || !(file instanceof Blob)) {
          return new Response("file required (multipart/form-data)", { status: 400 });
        }
        if (file.size < 1024) {
          return new Response("Recording is empty — please try again.", { status: 400 });
        }

        const mime = (file.type || "audio/webm").split(";")[0];
        const extByMime: Record<string, string> = {
          "audio/webm": "webm",
          "audio/mp4": "mp4",
          "audio/mpeg": "mp3",
          "audio/wav": "wav",
          "audio/ogg": "ogg",
        };
        const ext = extByMime[mime] ?? "webm";

        const upstream = new FormData();
        upstream.append("model", model);
        upstream.append("file", file, `recording.${ext}`);
        if (language && /^[a-z]{2}$/i.test(language)) {
          upstream.append("language", language.toLowerCase());
        }

        const res = await fetch(
          "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${key}` },
            body: upstream,
          },
        );

        if (!res.ok) {
          const err = await res.text().catch(() => "");
          return new Response(err || `STT failed: ${res.status}`, { status: res.status });
        }
        const data = await res.json().catch(() => ({}));
        return Response.json({ text: (data as { text?: string }).text ?? "" });
      },
    },
  },
});