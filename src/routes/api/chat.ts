import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { runChatGateway } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatBody;
        try {
          body = (await request.json()) as ChatBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const lang = body.lang ?? request.headers.get("x-user-language") ?? "en";
        const text = getLatestUserText(body) || "Help me understand the current workspace.";
        const result = await runChatGateway({
          prompt: text,
          lang,
          pageContext: body.pageContext,
          authorizationHeader: request.headers.get("authorization"),
          requestHeaders: request.headers,
        });

        if (body.stream === false) {
          return Response.json(result, {
            headers: {
              "Cache-Control": "no-store",
              "x-1inow-sense-provider": result.provider,
              "x-1inow-sense-mode": result.mode,
            },
          });
        }
        const textId = `sense-${Date.now()}`;

        const stream = createUIMessageStream({
          execute: ({ writer }) => {
            writer.write({ type: "text-start", id: textId });
            writer.write({ type: "text-delta", id: textId, delta: result.text });
            writer.write({ type: "text-end", id: textId });
          },
          onError: () => "Sense could not answer this request.",
        });

        return createUIMessageStreamResponse({
          stream,
          headers: {
            "Cache-Control": "no-store",
            "x-1inow-sense-provider": result.provider,
            "x-1inow-sense-mode": result.mode,
          },
        });
      },
    },
  },
});

type ChatBody = {
  messages?: UIMessage[];
  message?: UIMessage;
  lang?: string;
  pageContext?: unknown;
  stream?: boolean;
};

function getLatestUserText(body: ChatBody) {
  const candidates = [body.message, ...(body.messages ?? []).slice().reverse()].filter(Boolean);
  const message = candidates.find((item) => item?.role === "user") ?? candidates[0];
  if (!message) return "";
  return (message.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}
