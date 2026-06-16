import {
  CompassMark, PortfolioCard, ExecutionNode, SignalWave, TimelinePulse,
  PeopleOrbit, KnowledgeLens, VaultMark, DecisionDiamond, IntelligenceBars,
  AdvisorRing, ShieldLine, WorkMark, InboxRoute,
} from "@/components/icons/compass-icons";
import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

export type NavGroup = {
  label: string;
  items: { to: string; label: string; icon: NavIcon }[];
};

/**
 * Sidebar groups. Labels are i18n keys ("nav.<Label>").
 * Routes that do not yet exist will be added in later waves; for now the link
 * resolves to the legacy path so navigation never dead-ends.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Personal",
    items: [
      { to: "/my-work", label: "My Work", icon: WorkMark },
      { to: "/inbox", label: "Inbox", icon: InboxRoute },
      { to: "/favorites", label: "Favorites", icon: CompassMark },
    ],
  },
  {
    label: "Command",
    items: [
      { to: "/dashboard", label: "Command View", icon: CompassMark },
      { to: "/projects", label: "Portfolio", icon: PortfolioCard },
      { to: "/tasks", label: "Execution", icon: ExecutionNode },
      { to: "/communication", label: "Signals", icon: SignalWave },
      { to: "/calendar", label: "Timeline", icon: TimelinePulse },
    ],
  },
  {
    label: "People & Knowledge",
    items: [
      { to: "/people", label: "People", icon: PeopleOrbit },
      { to: "/documents", label: "Knowledge", icon: KnowledgeLens },
      { to: "/files", label: "Vault", icon: VaultMark },
    ],
  },
  {
    label: "Direction",
    items: [
      { to: "/approvals", label: "Decisions", icon: DecisionDiamond },
      { to: "/reports", label: "Intelligence", icon: IntelligenceBars },
      { to: "/ai", label: "Advisor", icon: AdvisorRing },
      { to: "/administration", label: "Control", icon: ShieldLine },
    ],
  },
];