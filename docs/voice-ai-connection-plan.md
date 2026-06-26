# Voice and AI Connection Plan

## Current Status

1inow has a prepared voice command interface and server endpoints:

- `/api/chat` — OpenAI adapter when `AI_PROVIDER=openai` (Phase A)
- `/api/stt` — OpenAI Whisper when `STT_PROVIDER=openai`
- `/api/tts` — OpenAI speech when `TTS_PROVIDER=openai`

Paid external services remain disabled by default until env selectors and secrets are configured.

## Connection Modes

### AI Brain

Supported future modes:

- `disabled`: production-safe default.
- `openai`: future assistant, planning, summarization, command reasoning.
- `anthropic`: future long-context reasoning and review.
- `gemini`: future multimodal and Google-oriented workflows.
- `internal`: future internal model gateway and provider router.

### Speech-To-Text

Supported future modes:

- `browser`: browser-native speech recognition when supported.
- `disabled`: no server transcription.
- `openai`: server transcription via Whisper (`/api/stt`).
- `google`: future Google Speech integration.
- `azure`: future Azure Speech integration.

### Text-To-Speech

Supported future modes:

- `disabled`: production-safe default.
- `browser`: future browser speech synthesis fallback.
- `openai`: server speech synthesis (`/api/tts`).
- `elevenlabs`: future high-quality voice generation.
- `azure`: future enterprise speech synthesis.

## Runtime Rules

- Provider selectors do not activate external services by themselves.
- Secret keys must only be configured in private local env or Vercel project settings.
- The repository must never contain production secrets.
- AI actions must be confirmable when they can create, update, delete, send, or publish data.
- Voice commands must keep preview and confirmation before execution.
- Notes, reminders, emails, payments, and external messages require separate implementation tasks.

## Prepared Environment Selectors

Safe non-secret selectors:

- `AI_PROVIDER`
- `AI_MODEL_ROUTER_ENABLED`
- `AI_AUDIT_LOGGING_ENABLED`
- `STT_PROVIDER`
- `TTS_PROVIDER`

Future private secrets:

- `OPENAI_API_KEY`
- `OPENAI_STT_MODEL` (default `whisper-1`)
- `OPENAI_TTS_MODEL` (default `tts-1`)
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `GOOGLE_SPEECH_API_KEY`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `INTERNAL_AI_GATEWAY_URL`
- `INTERNAL_AI_GATEWAY_TOKEN`

## Implemented Preparation

- Central server registry: `src/lib/connection-providers.server.ts`
- AI gateway: `src/lib/ai-gateway.server.ts` → `/api/chat`
- Voice gateway: `src/lib/voice-gateway.server.ts` → `/api/stt`, `/api/tts`
- Auth + `use_voice` permission on server STT/TTS routes
- Audit logging to `ai_actions` for STT/TTS when `AI_AUDIT_LOGGING_ENABLED` is not `false`
- Voice admin settings expose provider choices and test STT/TTS with bearer auth
- Browser voice commands remain available without paid external services

## Next Implementation Order

1. Decide whether to enable OpenAI in production (`AI_PROVIDER`, `STT_PROVIDER`, `TTS_PROVIDER`).
2. Add private provider secrets in Vercel and local private env.
3. Grant `use_voice` (and `use_assistant` for chat) to allowed users.
4. Implement server STT for non-OpenAI providers (Google, Azure) if needed.
5. Implement server TTS for ElevenLabs/Azure if higher-quality voice is required.
6. Add user-level rate limits and cost caps per organization.

## Disabled Until Approved

- Anthropic runtime calls
- Gemini runtime calls
- ElevenLabs runtime calls
- Google Speech runtime calls
- Azure Speech runtime calls
- Internal model gateway runtime calls
