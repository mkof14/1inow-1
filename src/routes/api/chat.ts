import { createFileRoute } from "@tanstack/react-router";
import { getChatProviderState } from "@/lib/connection-providers.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const service = getChatProviderState();

        return Response.json({
          message: service.message,
          disabled: service.disabled,
          provider: service.provider,
          status: service.status,
          capabilities: service.capabilities,
          nextStep: service.nextStep,
        });
      },
    },
  },
});
