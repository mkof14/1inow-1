# Voice-First Production Plan

## Product north star

1inow is **not** another project-management app. It is a **voice-first intelligent partner** for business processes and daily personal life.

The system speaks through **two conversational layers**:

| Persona | Role | Voice character |
| --- | --- | --- |
| **Nova** | Execution — movement, next steps, momentum | Direct, energetic (`marin` TTS) |
| **Vera** | Review — meaning, risk, missing context, clarifying questions | Calm, analytical (`shimmer` TTS) |

**Sense** is the umbrella assistant brand (`1inow Sense`) that coordinates Nova + Vera, chat, voice commands, memory, and workspace context.

> Note: marketing and code use **Nova** (not “Nava”).

---

## Current architecture (after pre-production pass)

```text
User voice/text
    → Thinking engine (intent, memory, rules, confidence)
    → Chat gateway (OpenAI or local Sense templates)
    → Nova + Vera structured reply
    → TTS (dual voice when server OpenAI enabled)
    → Optional workspace actions (tasks, projects, inbox) with confirmation
```

### Wired today

- **Sense Chat** (`ai-sidebar`) — `/api/chat`, page context, dual-voice TTS
- **Voice Command Center** — local intent parser, browser STT **or server STT fallback**, task/project create
- **Thinking engine** — now feeds chat gateway (projects, tasks, memories, rules)
- **OpenAI path** — Nova/Vera system prompt, audit to `ai_actions`
- **Local Sense fallback** — keyword templates en/ru/uk when AI disabled
- **Portfolio / project advisor** — connected to chat gateway (no longer stub)
- **PWA** — manifest, service worker, icons, install prompt (authenticated + marketing pages)

### Still before “full intelligence”

| Gap | Priority | Notes |
| --- | --- | --- |
| Voice inbox → Supabase sync | High | Still localStorage |
| Memory write-back from chat/voice | High | `ai_memories` read in chat; no teach flow |
| Admin voice settings → runtime | Medium | Env vars vs DB settings split |
| Server STT in ai-sidebar mic | Medium | Voice center has fallback; sidebar uses browser SR |
| Notes/reminders voice intents | Medium | Parsed but not executable |
| Self-learning loop | Medium | Intelligence UI exists; not closed loop |
| Multilingual voice parsers (es/de) | Medium | UI i18n yes; voice keywords mostly en/ru |

---

## Enable voice brain in production (env)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
STT_PROVIDER=openai
TTS_PROVIDER=openai
AI_AUDIT_LOGGING_ENABLED=true
```

Grant permissions: `use_assistant`, `use_voice`.

Safe defaults (no paid AI): keep `AI_PROVIDER=disabled`, `STT_PROVIDER=browser`, `TTS_PROVIDER=disabled` — local Sense + browser voice still work.

---

## Recommended rollout order

1. Apply Supabase migrations 1–9 (`docs/supabase-migration-runbook.md`)
2. Enable OpenAI chat + STT/TTS in Vercel when approved
3. Manual verify: `bash scripts/verify-workspace-manual.sh`
4. Voice inbox persistence (Supabase table + sync)
5. Memory teach-from-chat (“remember that…”) → `ai_memories`
6. Public marketing: emphasize Nova/Vera on landing (already in personas section)

---

## Validation

```bash
npm run smoke
bash scripts/verify-workspace-manual.sh
```

See also: `docs/production-launch-checklist.md`
