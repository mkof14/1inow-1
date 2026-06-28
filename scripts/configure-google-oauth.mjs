#!/usr/bin/env node
/**
 * Push Google OAuth credentials to Supabase via Management API.
 *
 * Required env (.env.local):
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   SUPABASE_ACCESS_TOKEN   (https://supabase.com/dashboard/account/tokens)
 *   VITE_SUPABASE_PROJECT_ID or SUPABASE_PROJECT_ID
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile(resolve(root, ".env"));
loadEnvFile(resolve(root, ".env.local"));

const projectRef =
  process.env.VITE_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID || "xpaevgvmweyqgsfisxak";
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

const missing = [
  ...(!clientId ? ["GOOGLE_OAUTH_CLIENT_ID"] : []),
  ...(!clientSecret ? ["GOOGLE_OAUTH_CLIENT_SECRET"] : []),
  ...(!accessToken ? ["SUPABASE_ACCESS_TOKEN"] : []),
];

if (missing.length > 0) {
  console.error("Missing env:", missing.join(", "));
  console.error("\nAdd to .env.local, then rerun:");
  console.error("  GOOGLE_OAUTH_CLIENT_ID=....apps.googleusercontent.com");
  console.error("  GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...");
  console.error("  SUPABASE_ACCESS_TOKEN=...  # dashboard → Account → Access Tokens");
  process.exit(1);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    external_google_enabled: true,
    external_google_client_id: clientId,
    external_google_secret: clientSecret,
    site_url: "https://www.1inow.com",
    uri_allow_list:
      "https://www.1inow.com/**,https://1inow.com/**,https://*.vercel.app/**,http://localhost:3000/**,http://localhost:3001/**,http://localhost:3002/**,http://localhost:5173/**",
  }),
});

if (!response.ok) {
  const body = await response.text();
  console.error("Supabase auth config update failed:", response.status, body.slice(0, 400));
  process.exit(1);
}

console.log("✓ Google OAuth configured on Supabase project", projectRef);
console.log("  Run: npm run verify:google-oauth");
