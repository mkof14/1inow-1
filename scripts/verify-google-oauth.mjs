#!/usr/bin/env node
/**
 * Verify Google OAuth is configured on the linked Supabase project.
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

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const redirectTo = process.env.GOOGLE_OAUTH_REDIRECT_TO || "https://www.1inow.com/auth";

console.log("1inow Google OAuth verification\n");

if (!url || !key) {
  console.log("  ✗ Missing Supabase URL or publishable key");
  process.exit(1);
}

const authorizeUrl = new URL(`${url}/auth/v1/authorize`);
authorizeUrl.searchParams.set("provider", "google");
authorizeUrl.searchParams.set("redirect_to", redirectTo);

const response = await fetch(authorizeUrl, {
  headers: { apikey: key },
  redirect: "manual",
});

if (response.status >= 300 && response.status < 400) {
  const location = response.headers.get("location") ?? "";
  if (location.includes("accounts.google.com")) {
    console.log("  ✓ Google OAuth authorize redirect looks healthy");
    console.log("  ✓ Project:", url);
    process.exit(0);
  }
  console.log("  ✗ Unexpected redirect:", location.slice(0, 120));
  process.exit(1);
}

const body = await response.text();
let message = body;
try {
  message = JSON.parse(body).msg ?? body;
} catch {
  // keep raw
}

console.log("  ✗ Google OAuth is not ready");
console.log("    ", message);

if (/missing OAuth secret/i.test(message)) {
  console.log("\nFix:");
  console.log("  1. Google Cloud → OAuth client → redirect URI:");
  console.log(`     ${url}/auth/v1/callback`);
  console.log("  2. Supabase → Authentication → Providers → Google");
  console.log("     Paste Client ID + Client Secret, then Save.");
  console.log("  3. Or run: npm run configure:google-oauth");
}

process.exit(1);
