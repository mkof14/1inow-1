import {
  CompassMark, PortfolioCard, ExecutionNode, SignalWave, TimelinePulse,
  PeopleOrbit, KnowledgeLens, VaultMark, DecisionDiamond, IntelligenceBars,
  ShieldLine, GearMark,
} from "@/components/icons/compass-icons";
import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
export type NavItem = { to: string; label: string; icon: NavIcon; adminOnly?: boolean };

/** Primary nav — max 6 items + "More" */
export const primaryNav: NavItem[] = [
  { to: "/dashboard",     label: "Home",     icon: CompassMark },
  { to: "/projects",      label: "Projects", icon: PortfolioCard },
  { to: "/tasks",         label: "Tasks",    icon: ExecutionNode },
  { to: "/people",        label: "People",   icon: PeopleOrbit },
  { to: "/communication", label: "Messages", icon: SignalWave },
  { to: "/files",         label: "Files",    icon: VaultMark },
];

/** "More" — collapsed by default */
export const moreNav: NavItem[] = [
  { to: "/calendar",       label: "Calendar",  icon: TimelinePulse },
  { to: "/reports",        label: "Reports",   icon: IntelligenceBars },
  { to: "/approvals",      label: "Decisions", icon: DecisionDiamond },
  { to: "/documents",      label: "Knowledge", icon: KnowledgeLens },
  { to: "/settings",       label: "Settings",  icon: GearMark },
  { to: "/administration", label: "Admin",     icon: ShieldLine, adminOnly: true },
];