import { ADMIN_ROUTE_PERMISSIONS, type AdminAreaPermission } from "@/lib/auth-roles";
import type { NavItem, NavSection } from "@/lib/nav-config";

export type AdminNavAccess = {
  canAccessAdmin: boolean;
  permissions: Record<AdminAreaPermission, boolean> | null;
};

function isAdminNavTarget(to: string) {
  return to === "/administration" || to.startsWith("/administration/");
}

export function isNavItemAccessible(item: NavItem, access: AdminNavAccess) {
  if (!item.adminOnly && !isAdminNavTarget(item.to)) {
    return true;
  }

  if (!access.canAccessAdmin) {
    return false;
  }

  const requiredPermission = ADMIN_ROUTE_PERMISSIONS[item.to];
  if (requiredPermission && access.permissions) {
    return access.permissions[requiredPermission];
  }

  return access.canAccessAdmin;
}

export function filterNavItems(items: NavItem[], access: AdminNavAccess) {
  return items.filter((item) => isNavItemAccessible(item, access));
}

export function filterNavSections(sections: NavSection[], access: AdminNavAccess) {
  return sections
    .map((section) => ({
      ...section,
      items: filterNavItems(section.items, access),
    }))
    .filter((section) => section.items.length > 0);
}
