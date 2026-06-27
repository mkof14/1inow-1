import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotification,
} from "@/lib/notifications";

export async function fetchUnreadNotificationCount() {
  const rows = await fetchMyNotifications(100);
  return rows.filter((n) => !n.read_at).length;
}

export async function fetchFirstUnreadNotification() {
  const rows = await fetchMyNotifications(100);
  return rows.find((n) => !n.read_at) ?? null;
}

export async function markFirstUnreadNotificationRead() {
  const first = await fetchFirstUnreadNotification();
  if (!first) return null;
  await markNotification(first.id, { read_at: new Date().toISOString() });
  return first;
}

export { markAllNotificationsRead };
