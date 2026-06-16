import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChannels, type Channel } from "@/lib/comm";
import { Hash, Lock, Globe, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewChannelDialog } from "./new-channel-dialog";
import { useT } from "@/lib/i18n";

const ICONS: Record<string, typeof Hash> = {
  company: Globe, project: Hash, private: Lock, group: Users, dm: Hash,
};

const GROUP_ORDER = ["company", "project", "group", "private", "dm"] as const;
const GROUP_KEY: Record<string, string> = {
  company: "comm.section.company",
  project: "comm.section.project",
  group: "comm.section.groups",
  private: "comm.section.private",
  dm: "comm.section.dm",
};

export function ChannelList({ activeId, onSelect }: { activeId: string | null; onSelect: (c: Channel) => void }) {
  const t = useT();
  const { data: channels = [] } = useQuery({ queryKey: ["channels"], queryFn: fetchChannels });
  const [creating, setCreating] = useState(false);

  const grouped = GROUP_ORDER.map((g) => ({ key: g, items: channels.filter((c) => c.type === g) })).filter((g) => g.items.length > 0);

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar/40 flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        <div className="text-sm font-semibold">{t("comm.channels")}</div>
        <Button variant="ghost" size="icon" onClick={() => setCreating(true)}><Plus className="size-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {grouped.map((g) => (
          <div key={g.key} className="mb-3">
            <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t(GROUP_KEY[g.key], g.key)}
            </div>
            {g.items.map((c) => {
              const Icon = ICONS[c.type] ?? Hash;
              const active = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-1.5 text-sm text-left transition-colors",
                    active ? "bg-card text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <NewChannelDialog open={creating} onOpenChange={setCreating} />
    </aside>
  );
}