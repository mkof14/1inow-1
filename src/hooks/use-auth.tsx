import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRoleFlags } from "@/lib/auth-roles";
import { ensureCurrentProfile } from "@/lib/profile-bootstrap";
import {
  disableFounderMode,
  enforceFounderModePolicy,
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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const founderMode = isFounderModeEnabled();

  useEffect(() => {
    enforceFounderModePolicy();
  }, []);

  useEffect(() => {
    if (founderMode) {
      setSession(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncFounderModeWithSession(Boolean(nextSession));
      setSession(nextSession);
      if (nextSession?.user) {
        void ensureCurrentProfile(nextSession.user).catch((error) => {
          console.warn("[auth] profile bootstrap failed", error);
        });
      }
    });

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        syncFounderModeWithSession(Boolean(data.session));
        if (data.session?.user) {
          try {
            await ensureCurrentProfile(data.session.user);
          } catch (error) {
            console.warn("[auth] profile bootstrap failed", error);
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
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }

    const uid = session?.user?.id;
    if (!uid) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }

    let cancelled = false;
    void resolveUserRoleFlags(uid).then((roles) => {
      if (cancelled) return;
      setIsAdmin(roles.isAdmin);
      setIsSuperAdmin(roles.isSuperAdmin);
    });

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
