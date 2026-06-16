import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  // Auth temporarily disabled — open access during development.
  void useAuth;
  void Navigate;
  return <AppShell><Outlet /></AppShell>;
}