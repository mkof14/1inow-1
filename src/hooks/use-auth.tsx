import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  ADMIN_AREA_PERMISSIONS,
  resolveAdminAreaAccess,
  resolveUserRoleFlags,
  type AdminAreaPermission,
} from "@/lib/auth-roles";
import { completeAuthenticatedInvite, readInviteToken } from "@/lib/invitations";
import {
  disableFounderMode,
  enforceFounderModePolicy,
  FOUNDER_ADMIN_ACCESS,
  FOUNDER_USER,
  isFounderModeEnabled,
  syncFounderModeWithSession,
} from "@/lib/founder-mode";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canAccessAdmin: boolean;
  adminPermissions: Record<AdminAreaPermission, boolean> | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState<Record<
    AdminAreaPermission,
    boolean
  > | null>(null);
  const founderMode = isFounderModeEnabled();

  useEffect(() => {
    enforceFounderModePolicy();
  }, []);

  useEffect(() => {
    if (founderMode) {
      setSession(null);
      setIsAdmin(FOUNDER_ADMIN_ACCESS.isAdmin);
      setIsSuperAdmin(FOUNDER_ADMIN_ACCESS.isSuperAdmin);
      setCanAccessAdmin(FOUNDER_ADMIN_ACCESS.canAccessAdmin);
      setAdminPermissions(
        Object.fromEntries(ADMIN_AREA_PERMISSIONS.map((key) => [key, true])) as Record<
          AdminAreaPermission,
          boolean
        >,
      );
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncFounderModeWithSession(Boolean(nextSession));
      setSession(nextSession);
      if (nextSession?.user) {
        void completeAuthenticatedInvite(nextSession.user, readInviteToken()).catch((error) => {
          console.warn("[auth] profile or invitation bootstrap failed", error);
        });
      }
    });

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        syncFounderModeWithSession(Boolean(data.session));
        if (data.session?.user) {
          try {
            await completeAuthenticatedInvite(data.session.user, readInviteToken());
          } catch (error) {
            console.warn("[auth] profile or invitation bootstrap failed", error);
          }
        }
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => sub.subscription.unsubscribe();
  }, [founderMode]);

  useEffect(() => {
    if (founderMode) {
      setIsAdmin(FOUNDER_ADMIN_ACCESS.isAdmin);
      setIsSuperAdmin(FOUNDER_ADMIN_ACCESS.isSuperAdmin);
      setCanAccessAdmin(FOUNDER_ADMIN_ACCESS.canAccessAdmin);
      setAdminPermissions(
        Object.fromEntries(ADMIN_AREA_PERMISSIONS.map((key) => [key, true])) as Record<
          AdminAreaPermission,
          boolean
        >,
      );
      return;
    }

    const uid = session?.user?.id;
    if (!uid) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setCanAccessAdmin(false);
      setAdminPermissions(null);
      return;
    }

    let cancelled = false;
    void Promise.all([resolveUserRoleFlags(uid), resolveAdminAreaAccess(uid)]).then(
      ([roles, access]) => {
        if (cancelled) return;
        setIsAdmin(roles.isAdmin);
        setIsSuperAdmin(roles.isSuperAdmin);
        setCanAccessAdmin(access.canAccessAdmin);
        setAdminPermissions(access.permissions);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [founderMode, session?.user?.id]);

  const value: AuthContextValue = {
    session,
    user: founderMode ? (FOUNDER_USER as unknown as User) : (session?.user ?? null),
    loading,
    isAdmin,
    isSuperAdmin,
    canAccessAdmin,
    adminPermissions,
    signOut: async () => {
      if (founderMode) {
        disableFounderMode();
      }
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
