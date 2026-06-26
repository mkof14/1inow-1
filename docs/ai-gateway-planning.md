# AI Gateway Planning — Phase 2 Step 8

## Summary

Planning document for the future AI layer. No external AI provider is connected in this step.

No runtime provider integration was added. No UI was changed.

## Current State

| Component | Status |
| --- | --- |
| `/api/chat` | Local Sense engine + optional OpenAI gateway (`ai-gateway.server.ts`) |
| `/api/stt` | 501 stub; browser STT fallback in UI |
| `/api/tts` | 501 stub; browser speech synthesis fallback |
| Advisor / translate / rewrite server fns | Disabled placeholders |
| `connection-providers.server.ts` | Provider env model defined, not wired to external APIs |
| AI DB tables | Present (`ai_memories`, `ai_actions`, etc.) |
| Intelligence UI | Reads/writes local AI tables only |

Environment defaults (`.env.example`):

- `AI_PROVIDER=disabled`
- `AI_MODEL_ROUTER_ENABLED=false`
- `AI_AUDIT_LOGGING_ENABLED=true`
- `STT_PROVIDER=browser`
- `TTS_PROVIDER=disabled`

## Target Architecture

```text
UI (AiSidebar, Voice, Intelligence)
        │
        ▼
/api/ai/*  (future route group)
        │
        ▼
Internal AI Gateway (server-only)
  ├── auth + permission checks
  ├── policy / org rules
  ├── model router
  ├── provider adapters (OpenAI, Anthropic, Gemini, internal)
  ├── audit + cost logging
  └── response normalizer
        │
        ▼
External providers (later, explicit approval)
```

## Planned Route Groups

| Route | Purpose |
| --- | --- |
| `/api/chat` | Conversational assistant (currently Sense local) |
| `/api/stt` | Server speech-to-text |
| `/api/tts` | Server text-to-speech |
| `/api/ai/actions` | Proposed/approved AI actions (future) |
| `/api/ai/memories` | Memory CRUD boundary (future) |

Keep provider SDK calls out of React components.

## Permission and Audit Requirements

Before connecting a provider:

1. Check `has_permission('use_assistant')` or stricter org policy
2. Respect `system_settings` keys:
   - `assistant.enabled`
   - `assistant.require_approval`
   - `assistant.max_autonomous_actions_per_day`
3. Write to `ai_actions` / `audit_logs` for sensitive operations
4. Honor `user_privacy_zones` and memory rejection states

## Model Router Plan

When `AI_MODEL_ROUTER_ENABLED=true`:

| Task type | Preferred route |
| --- | --- |
| Chat / reasoning | Configured `AI_PROVIDER` |
| STT | `STT_PROVIDER` |
| TTS | `TTS_PROVIDER` |
| Translation | Dedicated translation provider later |
| Embeddings / search | Internal or approved provider later |

Router should fail closed when secrets missing — same behavior as current stubs.

## Provider Rollout Order (Suggested)

1. **Phase A:** OpenAI chat only behind gateway + audit
2. **Phase B:** STT/TTS provider wiring with browser fallback retained
3. **Phase C:** AI actions with approval queue (`ai_action_approvals`)
4. **Phase D:** Memory sync and intelligence automation
5. **Phase E:** Multi-provider router (Anthropic/Gemini)

Each phase requires explicit approval and separate commit/tag.

## Cost and Rate Limits

Plan server-side controls:

- Per-user daily action cap (setting already seeded)
- Per-org policy later
- Token/cost logging table or metadata on `ai_actions`
- Hard disable switch via `AI_PROVIDER=disabled`

## Migration From Current Sense Local Engine

The local Sense engine remains valid as a zero-cost fallback.

Future gateway should support modes:

- `disabled` — placeholder/stub responses
- `local_sense` — current rule-based Nova/Vera
- `provider` — external model through adapter

This allows production demos without API keys and gradual provider rollout.

## Do Not Do Yet

- Add `OPENAI_API_KEY` to repo
- Call external APIs from UI components
- Remove Sense local engine before provider adapter exists
- Connect AI writes without approval policy decision

## Phase 2 Completion Status

Steps 1–8 foundation reviews and initial stabilizations are documented.

Implemented after foundation pass (no migrations required):

1. Organization bootstrap migration — deferred to manual Supabase apply
2. Notification helpers + event triggers — wired in project/task/decision/comm flows
3. Permission-key guards — comm, decisions, project-task engine
4. RLS tightening — migration prepared, apply on Supabase when ready
5. AI provider Phase A — OpenAI gateway with local Sense fallback + `ai_actions` audit

## Validation

```bash
npm run build
npm run smoke
```
