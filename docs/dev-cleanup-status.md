# Development Cleanup Status

## What Was Removed

- Removed platform package dependencies from `package.json`.
- Removed the platform AI gateway helper.
- Removed the platform auth integration wrapper.
- Replaced platform browser error reporting with a neutral local error logger.
- Replaced the old hosted app URL with `https://1inow.com`.
- Removed old package-age bypass entries in `bunfig.toml`.
- Cleaned `.env.example` so it only contains Supabase/Vercel-safe local development variables.

## What Was Stubbed

- `/api/chat`
  - Keeps the same route.
  - Returns JSON with: `AI service is not connected yet.`
  - Does not call any external AI provider.

- `/api/stt`
  - Keeps the same route.
  - Validates that a multipart `file` exists.
  - Returns `501 Not Implemented` with a clear disabled-service message.
  - Does not call any external speech-to-text provider.

- `/api/tts`
  - Keeps the same route.
  - Validates that `text` exists.
  - Returns `501 Not Implemented` with a clear disabled-service message.
  - Does not call any external text-to-speech provider.

- Advisor server functions
  - Keep their public server function names.
  - Return a clear disabled-service response.
  - Do not call external AI.

- Translation and rewrite server functions
  - Keep their public server function names.
  - Return clear disabled-service responses.
  - Do not call external AI.

## Disabled Features

- AI chat
- Speech-to-text
- Text-to-speech
- AI portfolio advisor
- AI project advisor
- Translations
- AI rewrite/editing
- Broker-based OAuth

## Still Needed Later

- OpenAI: choose and implement the production AI provider strategy.
- Resend: add transactional email provider configuration.
- Stripe: add billing provider configuration if subscriptions or payments remain in scope.
- Analytics: choose analytics provider and privacy settings.
- Email: configure sender domain, templates, and deliverability checks.
- Monitoring: add production error reporting, logs, and uptime checks.
- Reconnect `/api/chat` to the chosen provider.
- Reconnect `/api/stt` and `/api/tts` if voice features remain in scope.
- Reconnect translations/rewrite if those features remain in scope.
- Configure direct Supabase OAuth providers before enabling Google sign-in.
- Decide whether to keep `@ai-sdk/react` and `ai` for the future AI layer or remove/re-add them when implementation starts.

## Validation Status

- `npm install`: passed
- `npm run build`: passed

Build notes:

- TanStack reports existing `createServerFn().inputValidator()` deprecation warnings.
- Vite reports existing large chunk warnings.
