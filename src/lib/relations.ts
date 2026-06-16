import { supabase } from "@/integrations/supabase/client";

export type EntityType =
  | "project"
  | "task"
  | "person"
  | "message"
  | "file"
  | "document"
  | "meeting"
  | "decision"
  | "report"
  | "company"
  | "partner"
  | "investor"
  | "note"
  | "approval";

export const ENTITY_LABEL: Record<EntityType, string> = {
  project: "Projects",
  task: "Tasks",
  person: "People",
  message: "Messages",
  file: "Files",
  document: "Documents",
  meeting: "Meetings",
  decision: "Decisions",
  report: "Reports",
  company: "Companies",
  partner: "Partners",
  investor: "Investors",
  note: "Notes",
  approval: "Approvals",
};

export const ENTITY_TYPES: EntityType[] = Object.keys(ENTITY_LABEL) as EntityType[];

// Map entity type to the supabase table holding it + the column used as label.
type Resolver = {
  table: string;
  label: string;
  route?: (id: string, row: any) => string;
};

const RESOLVERS: Partial<Record<EntityType, Resolver>> = {
  project: { table: "projects", label: "name", route: (_, r) => `/projects/${r?.slug ?? _}` },
  task: { table: "tasks", label: "title", route: () => `/tasks` },
  person: { table: "profiles", label: "full_name", route: () => `/people` },
  message: { table: "messages", label: "content", route: () => `/messages` },
  decision: { table: "decisions", label: "title", route: () => `/decisions` },
};

export type Relation = {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation_type: string;
  created_at: string;
};

export type RelatedItem = {
  relationId: string;
  type: EntityType;
  id: string;
  label: string;
  href?: string;
  raw?: any;
};

export async function listRelations(sourceType: EntityType, sourceId: string): Promise<RelatedItem[]> {
  const { data, error } = await supabase
    .from("relations")
    .select("*")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Relation[];

  // hydrate by type
  const byType = new Map<string, string[]>();
  for (const r of rows) {
    const arr = byType.get(r.target_type) ?? [];
    arr.push(r.target_id);
    byType.set(r.target_type, arr);
  }

  const hydrated: Record<string, any> = {};
  await Promise.all(
    Array.from(byType.entries()).map(async ([type, ids]) => {
      const res = RESOLVERS[type as EntityType];
      if (!res) return;
      const { data: list } = await supabase
        .from(res.table as any)
        .select("*")
        .in("id", ids);
      for (const row of (list ?? []) as any[]) hydrated[`${type}:${row.id}`] = row;
    }),
  );

  return rows.map((r) => {
    const res = RESOLVERS[r.target_type as EntityType];
    const row = hydrated[`${r.target_type}:${r.target_id}`];
    const label = row && res ? (row[res.label] ?? "Untitled") : "Untitled";
    return {
      relationId: r.id,
      type: r.target_type as EntityType,
      id: r.target_id,
      label: String(label).slice(0, 120),
      href: res?.route?.(r.target_id, row),
      raw: row,
    };
  });
}

export async function createRelation(args: {
  sourceType: EntityType;
  sourceId: string;
  targetType: EntityType;
  targetId: string;
  relationType?: string;
  createdBy: string;
}) {
  const { error } = await supabase.from("relations").insert({
    source_type: args.sourceType,
    source_id: args.sourceId,
    target_type: args.targetType,
    target_id: args.targetId,
    relation_type: args.relationType ?? "related",
    created_by: args.createdBy,
  });
  if (error) throw error;
}

export async function deleteRelation(relationId: string) {
  const { error } = await supabase.from("relations").delete().eq("id", relationId);
  if (error) throw error;
}

export async function searchEntities(type: EntityType, q: string): Promise<{ id: string; label: string }[]> {
  const res = RESOLVERS[type];
  if (!res) return [];
  let query = supabase.from(res.table as any).select(`id, ${res.label}`).limit(20);
  if (q) query = query.ilike(res.label, `%${q}%`);
  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as any[]).map((r) => ({ id: r.id, label: String(r[res.label] ?? "Untitled") }));
}

export function isResolvable(type: EntityType): boolean {
  return !!RESOLVERS[type];
}