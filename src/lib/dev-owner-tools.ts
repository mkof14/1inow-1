/**
 * Client-side gate for dev-owner tooling UI.
 * Server functions still require ENABLE_DEV_OWNER_TOOLS=true via config.server.ts.
 */
export function isDevOwnerToolsAvailable() {
  return import.meta.env.VITE_ENABLE_DEV_OWNER_TOOLS === "true";
}
