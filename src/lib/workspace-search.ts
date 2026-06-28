/** Cross-module workspace search (Vault, Documents, voice). */

import { supabase } from "@/integrations/supabase/client";

export type WorkspaceSearchKind = "project" | "task" | "inbox" | "memory" | "decision";

export type WorkspaceSearchHit = {
  id: string;
  kind: WorkspaceSearchKind;
  title: string;
  snippet?: string;
  href: string;
};

function ilikePattern(raw: string) {
  return `%${raw.replace(/[%_\\]/g, "").trim()}%`;
}

type SearchScope = "vault" | "documents" | "all";

export async function searchWorkspace(
  query: string,
  scope: SearchScope = "all",
  limit = 24,
): Promise<WorkspaceSearchHit[]> {
  const term = query.trim();
  if (!term) return [];

  const pattern = ilikePattern(term);
  const perKind = Math.max(3, Math.ceil(limit / 5));
  const hits: WorkspaceSearchHit[] = [];

  const includeVault = scope === "vault" || scope === "all";
  const includeDocs = scope === "documents" || scope === "all";

  const jobs: Promise<void>[] = [];

  if (includeVault) {
    jobs.push(
      supabase
        .from("projects")
        .select("id,name,description,slug")
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(perKind)
        .then(({ data }) => {
          for (const row of data ?? []) {
            hits.push({
              id: row.id,
              kind: "project",
              title: row.name,
              snippet: row.description?.slice(0, 120) || undefined,
              href: `/projects/${row.slug}`,
            });
          }
        }),
      supabase
        .from("tasks")
        .select("id,title,description,projects(slug,name)")
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(perKind)
        .then(({ data }) => {
          for (const row of data ?? []) {
            const project = row.projects as { slug?: string; name?: string } | null;
            hits.push({
              id: row.id,
              kind: "task",
              title: row.title,
              snippet: project?.name
                ? `${project.name} · ${row.description?.slice(0, 80) ?? ""}`.trim()
                : row.description?.slice(0, 120) || undefined,
              href: project?.slug
                ? `/projects/${project.slug}`
                : `/tasks?q=${encodeURIComponent(row.title)}`,
            });
          }
        }),
    );
  }

  if (includeDocs) {
    jobs.push(
      supabase
        .from("ai_memories")
        .select("id,key,value,type")
        .eq("status", "active")
        .or(`key.ilike.${pattern},value.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(perKind)
        .then(({ data }) => {
          for (const row of data ?? []) {
            hits.push({
              id: row.id,
              kind: "memory",
              title: row.key,
              snippet: row.value?.slice(0, 120) || undefined,
              href: "/intelligence?tab=memory",
            });
          }
        }),
      supabase
        .from("decisions")
        .select("id,title,context,rationale,status")
        .or(`title.ilike.${pattern},context.ilike.${pattern},rationale.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(perKind)
        .then(({ data }) => {
          for (const row of data ?? []) {
            hits.push({
              id: row.id,
              kind: "decision",
              title: row.title,
              snippet: row.rationale?.slice(0, 120) ?? row.context?.slice(0, 120) ?? row.status,
              href: "/approvals",
            });
          }
        }),
    );
  }

  if (includeVault || includeDocs) {
    jobs.push(
      supabase
        .from("voice_inbox_items")
        .select("id,title,summary,raw_text,kind")
        .or(`title.ilike.${pattern},summary.ilike.${pattern},raw_text.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(perKind)
        .then(({ data }) => {
          for (const row of data ?? []) {
            hits.push({
              id: row.id,
              kind: "inbox",
              title: row.title,
              snippet: row.summary ?? row.raw_text?.slice(0, 120) ?? undefined,
              href: "/inbox",
            });
          }
        }),
    );
  }

  await Promise.all(jobs);
  return hits.slice(0, limit);
}

export function workspaceSearchResultMessage(
  count: number,
  lang = "en",
  query?: string,
  label = "Search",
) {
  const q = query ? ` «${query}»` : "";
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  if (count === 0) {
    if (ru) return `${label}${q}: ничего не найдено.`;
    if (es) return `${label}${q}: sin resultados.`;
    if (de) return `${label}${q}: keine Treffer.`;
    return `${label}${q}: no matches.`;
  }
  if (ru) return `${label}${q}: ${count} ${count === 1 ? "совпадение" : "совпадений"}.`;
  if (es) return `${label}${q}: ${count} resultado${count === 1 ? "" : "s"}.`;
  if (de) return `${label}${q}: ${count} Treffer.`;
  return `${label}${q}: ${count} match${count === 1 ? "" : "es"}.`;
}
