# Dev Phase Final — Testing Baseline

**Tag:** `v0.2.0-dev-phase-final`  
**Branch for review:** `cursor/dev-phase-final`  
**Date:** 2026-06-28  
**Live URL:** https://www.1inow.com  
**Supabase project:** `xpaevgvmweyqgsfisxak`

This tag marks the **end of the current development phase**. Use it for QA and stakeholder testing. The next phase is **production hardening** (see `docs/production-launch-checklist.md`).

---

## What is included

| Area | Status |
| --- | --- |
| Voice-first UI (Nova / Vera / Sense) | ✅ |
| Auth: email, Google OAuth, Founder bypass | ✅ (testing flags) |
| Auth page UX (wordmark, hero image, password toggle) | ✅ |
| Supabase data model + org RLS | ✅ (migrations in repo) |
| Workspace search, documents/files stubs | ✅ |
| Intelligence, voice inbox persistence | ✅ |
| PWA manifest + service worker | ✅ |
| Vercel production deploy | ✅ |
| SEO (sitemap, og:image, llms.txt) | ✅ |

---

## Testing flags (intentional for this phase)

These are **on for your testing** and should be **turned off before real production launch**:

| Variable | Testing value | Production target |
| --- | --- | --- |
| `VITE_ENABLE_FOUNDER_MODE` | `true` | `false` |
| `VITE_ENABLE_GOOGLE_AUTH` | `true` | `true` (after OAuth QA) |
| `ENABLE_DEV_OWNER_TOOLS` | off | `false` |

Founder entry: **Enter as Founder** on `/auth` → dashboard without Supabase session.

---

## How to test locally

```bash
cd 1inow-1
npm install
npm run dev
# Open the Local URL shown (often http://localhost:3002/auth)
```

```bash
npm run smoke
npm run verify:remote          # Supabase tables + org
npm run verify:google-oauth      # Google OAuth authorize probe
```

---

## Production QA checklist (manual)

1. **Auth** — `/auth`: Founder, Google, email sign-in/sign-up  
2. **Dashboard** — loads after each auth path  
3. **Voice** — Sense sidebar, Voice Command Center, STT chip  
4. **Projects / Tasks / Inbox** — basic CRUD and navigation  
5. **Administration** — visible for admin/founder roles  
6. **Mobile** — PWA install prompt, responsive layout  
7. **Google OAuth** — full round-trip on https://www.1inow.com/auth  

---

## Deferred to production phase

- Apply all Supabase org migrations on production DB (`npm run migrate:org`)
- Disable Founder mode on Vercel production
- OpenAI / ElevenLabs keys audit and rate limits
- Resend, Stripe, Sentry, analytics (env-gated)
- Lighthouse PWA ≥ 90, LCP measurement
- Native desktop app polish (`/desktop/`)

---

## Rollback / reference

```bash
git checkout v0.2.0-dev-phase-final
```

Previous baseline: `v0.1.0-production-base`

---

**Next step after QA:** open production phase — work through `docs/production-launch-checklist.md` item by item.
