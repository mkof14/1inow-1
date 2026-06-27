import process from "node:process";
import { resolveElevenLabsVoiceId } from "@/lib/elevenlabs-voices";

type ElevenLabsTtsInput = {
  text: string;
  voice?: string | null;
  lang?: string | null;
};

export async function synthesizeElevenLabsSpeech(input: ElevenLabsTtsInput) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing.");
  }

  const lang = input.lang?.trim() || "en";
  const voiceId = resolveElevenLabsVoiceId(lang, input.voice);
  const model = process.env.ELEVENLABS_MODEL?.trim() || "eleven_multilingual_v2";
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() || "mp3_44100_128";
  const languageCode = /^[a-z]{2}$/i.test(lang.slice(0, 2)) ? lang.slice(0, 2).toLowerCase() : null;

  const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
  url.searchParams.set("output_format", outputFormat);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: input.text,
      model_id: model,
      ...(languageCode ? { language_code: languageCode } : {}),
      voice_settings: {
        stability: 0.42,
        similarity_boost: 0.78,
        style: 0.18,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs TTS error (${response.status}): ${detail || response.statusText}`);
  }

  const audio = await response.arrayBuffer();
  const contentType = outputFormat.startsWith("mp3")
    ? "audio/mpeg"
    : response.headers.get("content-type") || "audio/mpeg";

  return { audio, contentType, voiceId, model };
}
