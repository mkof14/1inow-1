# Deploy to Vercel + GitHub

## 1. Push to GitHub

In Lovable, open the **+** menu (bottom-left of chat) → **GitHub** → **Connect project** → **Create Repository**. After that, every Lovable change auto-syncs to the repo, and pushes to the default branch sync back to Lovable.

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

Optional, only if you use them in server functions:

- `LOVABLE_API_KEY` — for the Lovable AI gateway.
- `SUPABASE_SERVICE_ROLE_KEY` — only if you call privileged admin APIs.

## 4. Deploy

Vercel builds on every push to the default branch (Production) and on every PR (Preview). The first deploy is triggered automatically once you click **Deploy** in the Vercel import flow.

## Notes

- Do **not** commit `.env` — it is already in `.gitignore`.
- The Cloudflare-specific `wrangler.toml` / `.wrangler/` config is unused on Vercel and safe to ignore.
- Database migrations live in `supabase/migrations/` and are applied through the existing Lovable Cloud pipeline, not by Vercel.