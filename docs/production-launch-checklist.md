# Production Launch Checklist

Everything below should be green before calling 1inow “production ready”.  
**Supabase migrations apply** is the only step intentionally deferred until you approve.

## 1. Database (manual — when ready)

- [ ] Apply migrations 1–9 in order (`bash scripts/verify-org-migrations.sh`)
- [ ] Post-apply SQL checks in `docs/supabase-migration-runbook.md`
- [ ] Owner account exists; profiles linked to organization

## 2. Security

- [x] RLS org-scoping (projects, tasks, comm, decisions, AI audit, project_members)
- [x] Permission guards on engines (tasks, teams, decisions, voice, admin)
- [x] Vercel security headers (`vercel.json` — HSTS, CSP, frame deny)
- [x] Auth route `noindex`
- [x] robots.txt blocks `/dashboard`, `/administration`, `/api/`
- [ ] Rotate / confirm no secrets in repo
- [ ] `VITE_ENABLE_FOUNDER_MODE=false`, `ENABLE_DEV_OWNER_TOOLS=false` on Vercel
- [ ] Review CSP `unsafe-inline` when stricter nonce strategy is feasible

## 3. Voice & AI (core product)

- [x] Nova + Vera structured prompts (OpenAI + local Sense)
- [x] Thinking engine + workspace context in chat gateway
- [x] Dual-voice TTS in Sense Chat sidebar
- [x] Server STT fallback in Voice Command Center
- [x] Advisor routes wired to chat gateway
- [ ] Enable OpenAI env when approved (`docs/voice-first-production-plan.md`)
- [ ] Voice inbox Supabase persistence
- [ ] Memory teach-back from conversation

## 4. PWA — install without native app

- [x] `manifest.webmanifest` with icons
- [x] PWA icons in `public/icons/` (regenerate: `bash scripts/generate-pwa-icons.sh`)
- [x] Service worker `public/sw.js` + `PwaRuntime` registration
- [x] Install prompt in authenticated app
- [ ] Lighthouse PWA audit ≥ 90 on production URL
- [ ] iOS “Add to Home Screen” tested on real device
- [ ] Optional: public install CTA on `/device-connections`

Native Electron path remains in `/desktop/` for macOS power users.

## 5. SEO & marketing

- [x] Sitemap `/sitemap.xml`, robots.txt, Google verification
- [x] OG/Twitter defaults + per-page meta on landing
- [x] Nova/Vera personas on landing (`public-assistant-personas`)
- [ ] Add `og:image` to all public info pages
- [ ] hreflang if multi-locale SEO is a priority
- [ ] Update `public/llms.txt` with full public URL list

## 6. Performance

- [x] Vendor chunk splitting (React, TanStack, Supabase, charts, PDF, AI)
- [x] Lazy PDF export on reports route
- [ ] Measure LCP on `/` and `/dashboard` in production (target < 2.5s)
- [ ] Consider font self-hosting to remove Google Fonts blocking

## 7. Integrations (env-gated)

| Service | Default | Enable when |
| --- | --- | --- |
| OpenAI chat/STT/TTS | off | Keys + permissions |
| Resend email | off | Domain + API key |
| Stripe billing | off | Webhook + keys |
| Sentry | off | DSN configured |
| Analytics | off | Consent + provider |

## 8. Automated checks

```bash
npm run smoke
npm run verify:production   # Supabase RPC/env checks when configured
bash scripts/verify-workspace-manual.sh
```

## 9. Post-launch monitoring

- [ ] Sentry alerts for `/api/chat`, `/api/stt`, `/api/tts` errors
- [ ] Supabase dashboard: RLS denials, slow queries
- [ ] Weekly review of `ai_actions` audit volume if OpenAI enabled

---

**Status:** Code path is pre-production ready; **migrations apply + OpenAI env + manual QA** remain before live users.
