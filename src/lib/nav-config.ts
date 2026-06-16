import {
  LayoutDashboard, FolderKanban, CheckSquare, MessageSquare, Users, UserCircle,
  Calendar, FileText, FolderOpen, Video, Map, BarChart3, ShieldCheck,
  BookOpen, Sparkles, Settings2, Cog,
} from "lucide-react";

export type NavGroup = {
  label: string;
  items: { to: string; label: string; icon: typeof LayoutDashboard }[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/tasks", label: "Tasks", icon: CheckSquare },
      { to: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/teams", label: "Teams", icon: Users },
      { to: "/people", label: "People", icon: UserCircle },
      { to: "/communication", label: "Communication", icon: MessageSquare },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { to: "/documents", label: "Documents", icon: FileText },
      { to: "/files", label: "Files", icon: FolderOpen },
      { to: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/meetings", label: "Meetings", icon: Video },
      { to: "/roadmaps", label: "Roadmaps", icon: Map },
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/approvals", label: "Approvals", icon: ShieldCheck },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/ai", label: "AI Assistant", icon: Sparkles },
      { to: "/administration", label: "Administration", icon: Cog },
      { to: "/settings", label: "Settings", icon: Settings2 },
    ],
  },
];