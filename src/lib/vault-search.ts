/** Workspace vault search — projects, tasks, and voice inbox until dedicated file storage ships. */

import { supabase } from "@/integrations/supabase/client";

export type VaultSearchHit = {
  id: string;
  kind: "project" | "task" | "inbox";
  title: string;
  snippet?: string;
  href: string;
};

function ilikePattern(raw: string) {
  return `%${raw.replace(/[%_\\]/g, "").trim()}%`;
}

export async function searchVault(query: string, limit = 24): Promise<VaultSearchHit[]> {
  const term = query.trim();
  if (!term) return [];

  const pattern = ilikePattern(term);
  const perKind = Math.max(4, Math.ceil(limit / 3));

  const [projectsRes, tasksRes, inboxRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,description,slug")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order("updated_at", { ascending: false })
      .limit(perKind),
    supabase
      .from("tasks")
      .select("id,title,description,projects(slug,name)")
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("updated_at", { ascending: false })
      .limit(perKind),
    supabase
      .from("voice_inbox_items")
      .select("id,title,summary,raw_text,kind")
      .or(`title.ilike.${pattern},summary.ilike.${pattern},raw_text.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(perKind),
  ]);

  const hits: VaultSearchHit[] = [];

  for (const row of projectsRes.data ?? []) {
    hits.push({
      id: row.id,
      kind: "project",
      title: row.name,
      snippet: row.description?.slice(0, 120) || undefined,
      href: `/projects/${row.slug}`,
    });
  }

  for (const row of tasksRes.data ?? []) {
    const project = row.projects as { slug?: string; name?: string } | null;
    hits.push({
      id: row.id,
      kind: "task",
      title: row.title,
      snippet: project?.name ? `${project.name} · ${row.description?.slice(0, 80) ?? ""}`.trim() : row.description?.slice(0, 120) || undefined,
      href: project?.slug ? `/projects/${project.slug}` : `/tasks?q=${encodeURIComponent(row.title)}`,
    });
  }

  for (const row of inboxRes.data ?? []) {
    hits.push({
      id: row.id,
      kind: "inbox",
      title: row.title,
      snippet: row.summary ?? row.raw_text?.slice(0, 120) ?? undefined,
      href: "/inbox",
    });
  }

  return hits.slice(0, limit);
}

export function vaultSearchResultMessage(
  count: number,
  lang = "en",
  query?: string,
) {
  const q = query ? ` «${query}»` : "";
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  if (count === 0) {
    if (ru) return `По Vault${q} ничего не найдено.`;
    if (es) return `Sin resultados en Vault${q}.`;
    if (de) return `Keine Vault-Treffer${q}.`;
    return `No vault matches${q}.`;
  }
  if (ru) return `Vault${q}: ${count} ${count === 1 ? "совпадение" : "совпадений"}.`;
  if (es) return `Vault${q}: ${count} resultado${count === 1 ? "" : "s"}.`;
  if (de) return `Vault${q}: ${count} Treffer.`;
  return `Vault${q}: ${count} match${count === 1 ? "" : "es"}.`;
}
