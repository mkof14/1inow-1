#!/usr/bin/env node
/**
 * Live Supabase checks for org migrations and voice inbox table.
 * Loads .env from repo root (no secrets printed).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(resolve(root, ".env"));
loadEnvFile(resolve(root, ".env.local"));

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

let failures = 0;
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  console.log(`  ✗ ${m}`);
  failures += 1;
};
const warn = (m) => console.log(`  ! ${m}`);

console.log("1inow remote Supabase checks\n");

if (!url || !key) {
  fail("Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function tableOk(name) {
  const { error } = await supabase.from(name).select("id", { head: true, count: "exact" });
  if (error) {
    fail(`Table ${name}: ${error.message}`);
    return false;
  }
  pass(`Table ${name} reachable`);
  return true;
}

await tableOk("organizations");
await tableOk("projects");
await tableOk("tasks");

const voiceOk = await tableOk("voice_inbox_items");
if (!voiceOk) {
  warn("Apply migration 20260626200000_voice_inbox_items.sql (see docs/supabase-migration-runbook.md)");
}

const { data: org, error: orgErr } = await supabase
  .from("organizations")
  .select("id,slug")
  .eq("slug", "1inow-workspace")
  .maybeSingle();

if (orgErr) fail(`organizations query: ${orgErr.message}`);
else if (org) pass("Default org 1inow-workspace exists");
else warn("Default org 1inow-workspace not found — run migration 20260626150000_default_organization_bootstrap.sql");

const { count, error: profErr } = await supabase
  .from("profiles")
  .select("id", { head: true, count: "exact" })
  .is("organization_id", null);

if (profErr) warn(`profiles org check: ${profErr.message}`);
else if ((count ?? 0) === 0) pass("All profiles linked to an organization");
else warn(`${count} profile(s) without organization_id — run ensure_profile_organization bootstrap`);

console.log("");
if (failures > 0) {
  console.log(`Remote checks failed: ${failures} error(s).`);
  process.exit(1);
}
console.log("Remote checks completed.");
