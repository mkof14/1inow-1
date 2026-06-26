import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureCurrentProfile } from "@/lib/profile-bootstrap";
import { disableFounderMode, FOUNDER_USER, isFounderModeEnabled } from "@/lib/founder-mode";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const founderMode = isFounderModeEnabled();

  useEffect(() => {
    if (founderMode) {
      setSession(null);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        void ensureCurrentProfile(s.user).catch((error) => {
          console.warn("[auth] profile bootstrap failed", error);
        });
      }
    });
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
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
      setIsAdmin(true);
      return;
    }

    const uid = session?.user?.id;
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.rpc("is_admin", { _user_id: uid });
        setIsAdmin(Boolean(data));
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [founderMode, session?.user?.id]);

  const value: AuthContextValue = {
    session,
    user: founderMode ? (FOUNDER_USER as unknown as User) : (session?.user ?? null),
    loading,
    isAdmin,
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
