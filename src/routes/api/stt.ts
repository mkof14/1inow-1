import { createFileRoute } from "@tanstack/react-router";
import { getSttProviderState } from "@/lib/connection-providers.server";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const file = form.get("file");
        if (!file || !(file instanceof Blob)) {
          return new Response("file required (multipart/form-data)", { status: 400 });
        }
        const service = getSttProviderState();

        return Response.json(
          {
            message: service.message,
            disabled: service.disabled,
            provider: service.provider,
            status: service.status,
            capabilities: service.capabilities,
            nextStep: service.nextStep,
          },
          { status: 501 },
        );
      },
    },
  },
});
