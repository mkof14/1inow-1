/** Workspace vault search — projects, tasks, and voice inbox until dedicated file storage ships. */

import { searchWorkspace, workspaceSearchResultMessage } from "@/lib/workspace-search";

export type VaultSearchHit = Awaited<ReturnType<typeof searchVault>>[number];

export async function searchVault(query: string, limit = 24) {
  return searchWorkspace(query, "vault", limit);
}

export function vaultSearchResultMessage(count: number, lang = "en", query?: string) {
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const label = ru ? "Vault" : lang.startsWith("es") ? "Vault" : lang.startsWith("de") ? "Vault" : "Vault";
  return workspaceSearchResultMessage(count, lang, query, label);
}

export { workspaceSearchResultMessage };
