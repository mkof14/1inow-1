# Production Integrations Planning

Phase 2 step: plan external providers without connecting paid services yet.

## Principles

1. Every integration is **disabled by default** in production.
2. Secrets live only in Vercel/local private env — never in git.
3. Runtime reads provider state from `src/lib/connection-providers.server.ts`.
4. UI shows **configured vs connected vs wired** separately.
5. Each provider gets its own approved implementation task before live calls.

## Provider matrix

| Service | Env gate | Required secrets | Runtime today | Next task |
| --- | --- | --- | --- | --- |
| Email (Resend) | `ENABLE_INVITATION_EMAIL=true` | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Send on invite create/resend when ready | Verify domain + template QA |
| Billing (Stripe) | `ENABLE_STRIPE=true` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | Not wired | Checkout + webhook handler |
| Analytics | `ANALYTICS_PROVIDER` | Provider-specific (see below) | Not wired | Privacy review + consent banner |
| Monitoring | `MONITORING_PROVIDER=sentry` | `SENTRY_DSN` | Not wired | Error boundary + server capture |
| AI chat | `AI_PROVIDER` | Provider API keys | Sense local engine only | AI gateway adapter |
| STT / TTS | `STT_PROVIDER`, `TTS_PROVIDER` | Provider keys | Browser fallback / 501 stubs | Voice adapter task |

### Analytics providers (planned)

| Provider | Env | Notes |
| --- | --- | --- |
| `disabled` | default | No client beacons |
| `plausible` | `PLAUSIBLE_DOMAIN` | Privacy-friendly page views |
| `posthog` | `POSTHOG_API_KEY`, `POSTHOG_HOST` | Product analytics; requires consent |
| `ga4` | `VITE_GA4_MEASUREMENT_ID` | Google Analytics; requires consent |

## Admin visibility

`/administration` dashboard reads `fetchIntegrationsOverview()` server function, which wraps `getConnectionOverview()`.

Statuses:

- **disabled** — feature flag off; safe default
- **not_configured** — flag on but secrets missing
- **ready** — secrets present; adapter may still be stubbed
- **browser_only** — STT/TTS local fallback

## Approval checklist before go-live

### Resend

- [ ] Domain verified in Resend
- [ ] `invitation` template reviewed in all active languages
- [ ] `ENABLE_INVITATION_EMAIL=true` in Vercel production
- [ ] Test invite to external inbox

### Stripe

- [ ] Products/prices created in Stripe dashboard
- [ ] Webhook endpoint deployed and signing secret set
- [ ] Test mode checkout verified before live keys

### Analytics

- [ ] Privacy policy updated
- [ ] Cookie/consent UX approved
- [ ] Production property/domain registered

### Monitoring

- [ ] Sentry project created
- [ ] Source maps upload configured in CI
- [ ] Alert rules for error rate spikes

## Validation

```bash
npm run verify:production
npm run smoke
```
