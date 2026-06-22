# Voice and AI Connection Plan

## Current Status

1inow has a prepared voice command interface and safe server endpoints:

- `/api/chat`
- `/api/stt`
- `/api/tts`

No paid external AI, speech-to-text, or text-to-speech provider is connected yet.

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
- `openai`: future server transcription.
- `google`: future Google Speech integration.
- `azure`: future Azure Speech integration.

### Text-To-Speech

Supported future modes:

- `disabled`: production-safe default.
- `browser`: future browser speech synthesis fallback.
- `openai`: future server speech synthesis.
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
- `/api/chat` now reports provider state and next connection step.
- `/api/stt` now reports provider state and remains `501` until server STT is implemented.
- `/api/tts` now reports provider state and remains `501` until server TTS is implemented.
- Voice admin settings now expose future provider choices.
- Browser voice commands remain available without paid external services.

## Next Implementation Order

1. Decide the first approved AI provider.
2. Add private provider secret in Vercel and local private env.
3. Implement adapter for `/api/chat`.
4. Add audit logging for prompt, result, action type, user id, provider, and timestamp.
5. Implement server STT only if browser recognition is not enough.
6. Implement server TTS only after deciding whether generated speech is required.
7. Add user-level permissions for AI and voice execution.

## Disabled Until Approved

- OpenAI runtime calls
- Anthropic runtime calls
- Gemini runtime calls
- ElevenLabs runtime calls
- Google Speech runtime calls
- Azure Speech runtime calls
- Internal model gateway runtime calls
