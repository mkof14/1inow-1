import { supabase } from "@/integrations/supabase/client";
import { isFounderModeEnabled } from "@/lib/founder-mode";

export type SenseAnswer = {
  text: string;
  provider: string;
  mode: string;
};

async function buildSenseHeaders(lang: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-user-language": lang,
  };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (isFounderModeEnabled()) headers["X-1inow-Founder-Voice"] = "1";
  return headers;
}

/** Non-streaming Sense answer for voice playback and command center. */
export async function fetchSenseAnswer(input: {
  prompt: string;
  lang: string;
  pageContext?: unknown;
}): Promise<SenseAnswer | null> {
  const prompt = input.prompt.trim();
  if (!prompt) return null;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: await buildSenseHeaders(input.lang),
      body: JSON.stringify({
        stream: false,
        lang: input.lang,
        pageContext: input.pageContext ?? null,
        message: {
          role: "user",
          parts: [{ type: "text", text: prompt }],
        },
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SenseAnswer;
  } catch {
    return null;
  }
}
