import {
  BrandMark,
  PortfolioCard,
  ExecutionNode,
  SignalWave,
  TimelinePulse,
  PeopleOrbit,
  KnowledgeLens,
  DecisionDiamond,
  IntelligenceBars,
  ShieldLine,
  GearMark,
} from "@/components/icons/compass-icons";
import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
export type NavItem = { to: string; label: string; icon: NavIcon; adminOnly?: boolean };
export type NavSection = { id: string; label: string; items: NavItem[]; adminOnly?: boolean };

/** Primary nav — focused working surface. */
export const primaryNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: BrandMark },
  { to: "/projects", label: "Projects", icon: PortfolioCard },
  { to: "/tasks", label: "Tasks", icon: ExecutionNode },
  { to: "/communication", label: "Messages", icon: SignalWave },
  { to: "/devices", label: "Devices", icon: SignalWave },
];

/** Secondary destinations remain available without competing with daily work. */
export const moreNav: NavItem[] = [
  { to: "/intelligence", label: "Intelligence", icon: IntelligenceBars },
  { to: "/reports", label: "Reports", icon: IntelligenceBars },
  { to: "/calendar", label: "Calendar", icon: TimelinePulse },
  { to: "/approvals", label: "Decisions", icon: DecisionDiamond },
  { to: "/people", label: "People", icon: PeopleOrbit },
  { to: "/documents", label: "Knowledge", icon: KnowledgeLens },
  { to: "/principles", label: "Principles", icon: ShieldLine },
  { to: "/settings", label: "Settings", icon: GearMark },
  { to: "/administration", label: "Admin", icon: ShieldLine, adminOnly: true },
];

/** Sidebar — grouped sections, no "More" popover. */
export const navSections: NavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: primaryNav,
  },
  {
    id: "review",
    label: "Review",
    items: [
      { to: "/intelligence", label: "Intelligence", icon: IntelligenceBars },
      { to: "/reports", label: "Reports", icon: IntelligenceBars },
      { to: "/approvals", label: "Decisions", icon: DecisionDiamond },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { to: "/calendar", label: "Calendar", icon: TimelinePulse },
      { to: "/people", label: "People", icon: PeopleOrbit },
      { to: "/documents", label: "Knowledge", icon: KnowledgeLens },
      { to: "/settings", label: "Settings", icon: GearMark },
    ],
  },
];

/** Footer — admin, legal, help. */
export const footerSections: NavSection[] = [
  {
    id: "insights",
    label: "Insights",
    items: [
      { to: "/intelligence", label: "Intelligence", icon: IntelligenceBars },
      { to: "/reports", label: "Reports", icon: IntelligenceBars },
      { to: "/portfolio", label: "Portfolio", icon: PortfolioCard },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [
      { to: "/administration", label: "Overview", icon: ShieldLine },
      { to: "/administration/users", label: "Users", icon: ShieldLine },
      { to: "/administration/roles", label: "Roles", icon: ShieldLine },
      { to: "/administration/invitations", label: "Invitations", icon: ShieldLine },
      { to: "/administration/emails", label: "Emails", icon: ShieldLine },
      { to: "/administration/email-logs", label: "Email logs", icon: ShieldLine },
      { to: "/administration/audit", label: "Audit log", icon: ShieldLine },
      { to: "/administration/voice", label: "Voice", icon: ShieldLine },
      { to: "/administration/settings", label: "System", icon: GearMark },
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      { to: "/help/faq", label: "FAQ", icon: ShieldLine },
      { to: "/help/learning", label: "Learning Center", icon: ShieldLine },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    items: [
      { to: "/legal/privacy", label: "Privacy Policy", icon: ShieldLine },
      { to: "/legal/terms", label: "Terms of Service", icon: ShieldLine },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { to: "/profile", label: "МК", icon: BrandMark },
      { to: "/settings", label: "Settings", icon: GearMark },
      { to: "/inbox", label: "Inbox", icon: SignalWave },
      { to: "/favorites", label: "Favorites", icon: BrandMark },
      { to: "/administration", label: "Admin Console", icon: ShieldLine, adminOnly: true },
    ],
  },
];
