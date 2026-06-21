import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        return Response.json({
          message: "AI service is not connected yet.",
          disabled: true,
        });
      },
    },
  },
});
