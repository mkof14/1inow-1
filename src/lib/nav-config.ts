import {
  CompassMark, PortfolioCard, ExecutionNode, SignalWave, TimelinePulse,
  PeopleOrbit, KnowledgeLens, VaultMark, DecisionDiamond, IntelligenceBars,
  ShieldLine, GearMark,
} from "@/components/icons/compass-icons";
import { BrainPulse } from "@/components/icons/brain-pulse";
import { ThinkingLoop } from "@/components/icons/thinking-loop";
import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
export type NavItem = { to: string; label: string; icon: NavIcon; adminOnly?: boolean };
export type NavSection = { id: string; label: string; items: NavItem[]; adminOnly?: boolean };

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
  { to: "/brain",          label: "System Brain", icon: BrainPulse },
  { to: "/thinking",       label: "Thinking Engine", icon: ThinkingLoop },
  { to: "/calendar",       label: "Calendar",  icon: TimelinePulse },
  { to: "/reports",        label: "Reports",   icon: IntelligenceBars },
  { to: "/approvals",      label: "Decisions", icon: DecisionDiamond },
  { to: "/documents",      label: "Knowledge", icon: KnowledgeLens },
  { to: "/intelligence",   label: "Intelligence", icon: IntelligenceBars },
  { to: "/principles",     label: "Principles", icon: ShieldLine },
  { to: "/simplicity",     label: "Simplicity", icon: ShieldLine },
  { to: "/settings",       label: "Settings",  icon: GearMark },
  { to: "/administration", label: "Admin",     icon: ShieldLine },
];

/** Sidebar — grouped sections, no "More" popover. */
export const navSections: NavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: primaryNav,
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { to: "/brain",        label: "System Brain",   icon: BrainPulse },
      { to: "/thinking",     label: "Thinking Engine", icon: ThinkingLoop },
      { to: "/reports",      label: "Reports",        icon: IntelligenceBars },
      { to: "/intelligence", label: "Intelligence",   icon: IntelligenceBars },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { to: "/calendar",   label: "Calendar",  icon: TimelinePulse },
      { to: "/approvals",  label: "Decisions", icon: DecisionDiamond },
      { to: "/documents",  label: "Knowledge", icon: KnowledgeLens },
      { to: "/principles", label: "Principles", icon: ShieldLine },
      { to: "/simplicity", label: "Simplicity", icon: ShieldLine },
    ],
  },
];

/** Footer — admin, legal, help. */
export const footerSections: NavSection[] = [
  {
    id: "admin",
    label: "Administration",
    adminOnly: true,
    items: [
      { to: "/administration",              label: "Overview",     icon: ShieldLine },
      { to: "/administration/users",        label: "Users",        icon: ShieldLine },
      { to: "/administration/roles",        label: "Roles",        icon: ShieldLine },
      { to: "/administration/invitations",  label: "Invitations",  icon: ShieldLine },
      { to: "/administration/emails",       label: "Emails",       icon: ShieldLine },
      { to: "/administration/email-logs",   label: "Email logs",   icon: ShieldLine },
      { to: "/administration/audit",        label: "Audit log",    icon: ShieldLine },
      { to: "/administration/voice",        label: "Voice",        icon: ShieldLine },
      { to: "/administration/settings",     label: "System",       icon: GearMark },
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      { to: "/help/faq",      label: "FAQ",              icon: ShieldLine },
      { to: "/help/learning", label: "Learning Center",  icon: ShieldLine },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    items: [
      { to: "/legal/privacy", label: "Privacy Policy",   icon: ShieldLine },
      { to: "/legal/terms",   label: "Terms of Service", icon: ShieldLine },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: GearMark },
      { to: "/inbox",    label: "Inbox",    icon: SignalWave },
      { to: "/favorites",label: "Favorites",icon: CompassMark },
    ],
  },
];