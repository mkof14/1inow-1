import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const file = form.get("file");
        if (!file || !(file instanceof Blob)) {
          return new Response("file required (multipart/form-data)", { status: 400 });
        }
        return Response.json(
          { message: "Speech-to-text service is not connected yet.", disabled: true },
          { status: 501 },
        );
      },
    },
  },
});
