# Production Readiness

## Current milestone

**Dev phase final (testing):** tag `v0.2.0-dev-phase-final` — see **`docs/dev-phase-final.md`**.  
Use this baseline for QA; production hardening follows `docs/production-launch-checklist.md`.

## Current Architecture Summary

1inow is a TanStack Start application built with Vite, React, TanStack Router, TanStack Query, Tailwind CSS, and Supabase.

The application currently uses:

- TanStack Start server functions for authenticated server-side actions.
- Supabase browser and server clients for data access and auth-aware server work.
- Local API routes for `/api/chat`, `/api/stt`, and `/api/tts` with env-gated external providers.
- Local Sense chat and browser STT/TTS fallbacks when paid providers are disabled.
- Vercel-oriented build settings through standard Vite/TanStack configuration.

No Lovable runtime, package, gateway endpoint, or environment variable is required for the current build.

## Warnings Fixed

- Replaced deprecated `createServerFn().inputValidator()` calls with `createServerFn().validator()`.
- Removed unused imports and unused local variables identified by TypeScript unused checks.
- Removed the static report export import from the reports route so PDF export libraries load only when export actions are used.
- Added production vendor chunk splitting for React, TanStack, Supabase, charting, PDF export, AI SDK, and UI libraries.
- Filtered known TanStack package-internal SSR unused-import warnings at the Rollup warning boundary.

## Bundle Analysis

Before cleanup, the production client build reported oversized chunks:

- `reports` route chunk, about 854 KB, because report UI and export code pulled heavy PDF-related modules together.
- main `index` chunk, about 713 KB, because shared framework and vendor modules were bundled together.

After cleanup, no generated JavaScript chunk is larger than Vite's default 500 KB warning threshold.

Largest client chunks after cleanup:

- `vendor-charts`, about 421 KB: Recharts and chart dependencies used by report and analytics-style screens.
- `vendor-jspdf`, about 417 KB: PDF generation dependency, now loaded only when report export code is requested.
- shared app `index`, about 321 KB: core application shell and shared runtime.
- `vendor-react`, about 221 KB: React and React DOM.
- `vendor-supabase`, about 210 KB: Supabase client runtime.
- `vendor-html2canvas`, about 201 KB: PDF/export rendering dependency, loaded with report export code.

The report export path is now lazy-loaded from `src/routes/_authenticated/reports.tsx`. This keeps normal report-page navigation behavior unchanged while avoiding eager PDF export cost.

## Warnings Intentionally Left

No Vite/Rollup build warnings remain in the current production build.

`npm run lint` still reports a large existing formatting backlog across the project because Prettier is enforced as an ESLint error. That backlog is not specific to Lovable cleanup or production build readiness and should be handled in a dedicated formatting-only pass to avoid mixing cosmetic changes with functional cleanup.

## Remaining Technical Debt

- Several UI and route files still rely on broad `any` types. TypeScript build settings currently allow this, but a stricter typing pass should be planned.
- The lint setup treats formatting as errors, but the existing codebase is not fully Prettier-formatted.
- AI, speech, translation, email, billing, analytics, and monitoring external providers are env-gated; local Sense + browser voice remain available.
- Dev-owner and demo-data helpers remain available and should be reviewed before production exposure.
- Bundle chunking is now below the default warning threshold, but future feature additions should be watched so charting, PDF, AI SDK, and UI vendor chunks do not drift upward unchecked.

## Recommendations Before Production

See **`docs/production-launch-checklist.md`** for the full go-live checklist and **`docs/voice-first-production-plan.md`** for Nova/Vera voice-first architecture.

1. Apply Supabase org migrations 1–10 when approved (`npm run migrate:org` or runbook).
2. Run a dedicated Prettier formatting pass and commit it separately.
3. Keep dev-owner and demo-data tools environment-gated in production.
4. Enable OpenAI, Resend, Stripe, Sentry, and analytics in separate phases per env gates.
5. Complete PWA Lighthouse audit after deploy.
6. ~~Persist voice inbox and memory teach-back~~ — shipped; dedicated file upload storage remains planned.

## Validation

- `npx tsc --noEmit --noUnusedLocals true --noUnusedParameters true`: passed
- `npm run build`: passed

Final validation should always include:

- `npm install`
- `npm run build`
