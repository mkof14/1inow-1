# Deploy to Vercel + GitHub

## 1. Push to GitHub

Use the GitHub repository as the source of truth for Vercel deploys.

If you prefer to push manually from a clone:

```bash
git clone <your-repo-url>
cd <repo>
git add .
git commit -m "Initial commit"
git push origin main
```

## 2. Import the repo into Vercel

1. Go to <https://vercel.com/new> and import the GitHub repository.
2. **Framework Preset:** Other (the included `vercel.json` handles the rest).
3. **Build Command:** `vite build` (already set in `vercel.json`).
4. **Output Directory:** `.output/public` (already set in `vercel.json`).
5. **Install Command:** leave default (`bun install` / `npm install`).

The `NITRO_PRESET=vercel` env var in `vercel.json` tells the TanStack Start / Nitro build to emit a Vercel-compatible serverless bundle instead of the default Cloudflare Workers output.

## 3. Environment variables (Vercel → Project Settings → Environment Variables)

Copy from `.env.example`. Required:

| Name | Scope | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Production, Preview, Development | from `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | from `.env` |
| `VITE_SUPABASE_PROJECT_ID` | Production, Preview, Development | from `.env` |
| `SUPABASE_URL` | Production, Preview, Development | same as VITE_* |
| `SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | same as VITE_* |
| `SUPABASE_PROJECT_ID` | Production, Preview, Development | same as VITE_* |

Optional, only if you use privileged server functions:

- `SUPABASE_SERVICE_ROLE_KEY` — only if you call privileged admin APIs.

### Google sign-in on Vercel

Google OAuth should be configured directly in Supabase before enabling the
**Continue with Google** button.

Email/password sign-in via the backend works on Vercel without any extra
setup. To turn the Google button back on, configure Supabase OAuth redirect URLs
for the deployment and set `VITE_ENABLE_GOOGLE_AUTH="true"`.

## 4. Post-deploy check: email/password auth flow

After the first deploy completes, run this checklist on the live Vercel URL.

### 4.1 Sign up a test account
1. Open the deployed URL in an **incognito/private** window (no existing session).
2. Click **Create account**.
3. Enter a real email address you control, set a password, and submit.
4. Check your inbox for the confirmation email. Click the confirmation link.
5. You should be redirected back to the app and land on the **main screen** (`/dashboard` or `/simplicity`).

### 4.2 Verify the session
1. Open browser DevTools → **Application** → **Local Storage** → your domain.
2. Look for a key starting with `sb-<project-id>` (the Supabase session). It should contain `access_token`, `refresh_token`, and `expires_at`.
3. Refresh the page. The session should persist and you should **stay logged in** (no redirect to `/auth`).

### 4.3 Test protected routes
1. While logged in, visit `/dashboard` directly by typing the URL.
2. The page should load without errors.
3. Visit `/auth` directly while logged in. Depending on the app logic, you may be redirected back to the main screen.

### 4.4 Test sign-out and re-login
1. Click **Sign out**.
2. You should be redirected to `/auth`.
3. Try visiting `/dashboard` — you should be redirected to `/auth` or see a login prompt.
4. Log in with the same email and password.
5. You should land on the main screen and the session should reappear in Local Storage.

### 4.5 What if something fails?
| Symptom | Likely cause | Fix |
|---|---|---|
| "Invalid credentials" | Typo or unconfirmed email | Confirm email first; check password |
| Redirect loops after login | `VITE_SUPABASE_*` env vars missing | Add all 6 env vars in Vercel → Project Settings → Environment Variables, then redeploy |
| 401 on protected routes | Session not attached to server requests | Check that `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set (server-side vars) |
| Blank page after refresh | SSR crash with missing env vars | Same as above; open browser console for the exact error |

## 5. Deploy

Vercel builds on every push to the default branch (Production) and on every PR (Preview). The first deploy is triggered automatically once you click **Deploy** in the Vercel import flow.

## Notes

- Do **not** commit `.env` — it is already in `.gitignore`.
- The Cloudflare-specific `wrangler.toml` / `.wrangler/` config is unused on Vercel and safe to ignore.
- Database migrations live in `supabase/migrations/` and should be applied through the Supabase migration workflow, not by Vercel.
