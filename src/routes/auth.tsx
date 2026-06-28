import type { User } from "@supabase/supabase-js";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  clearOAuthCallbackFromUrl,
  hasOAuthCallbackInUrl,
  readOAuthCallbackError,
  resolveAuthSession,
  subscribeToAuthSession,
} from "@/lib/auth-session";
import {
  completeAuthenticatedInvite,
  fetchInvitationPreview,
  invitationRoleLabel,
  persistInviteToken,
  readInviteToken,
  type InvitationPreview,
} from "@/lib/invitations";
import {
  disableFounderMode,
  enableFounderMode,
  enforceFounderModePolicy,
  FOUNDER_EMAIL,
  isFounderAccessAvailable,
  isFounderModeEnabled,
  syncFounderModeWithSession,
} from "@/lib/founder-mode";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";

import { formatGoogleAuthError } from "@/lib/google-oauth";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: AuthPage,
});

function readInviteFromUrl() {
  if (typeof window === "undefined") return undefined;
  const token = new URLSearchParams(window.location.search).get("invite")?.trim();
  return token || undefined;
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitePreview, setInvitePreview] = useState<InvitationPreview | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthCompleting, setOauthCompleting] = useState(() => hasOAuthCallbackInUrl());
  const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === "true";
  const founderAccessAvailable = isFounderAccessAvailable();
  const founderMode = isFounderModeEnabled();

  useEffect(() => {
    const token = readInviteFromUrl() ?? readInviteToken();
    if (!token) return;
    setInviteToken(token);
    persistInviteToken(token);
  }, []);

  useEffect(() => {
    if (!inviteToken) {
      setInvitePreview(null);
      return;
    }

    let cancelled = false;
    setInviteLoading(true);
    void fetchInvitationPreview(inviteToken)
      .then((preview) => {
        if (cancelled) return;
        setInvitePreview(preview);
        if (preview?.email) setEmail(preview.email);
        if (preview) setAuthMode("sign-up");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Invitation could not be loaded");
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const finishAuth = useCallback(
    async (user: User) => {
      await completeAuthenticatedInvite(user, inviteToken);
      toast.success(
        inviteToken
          ? "Invitation accepted"
          : authMode === "sign-up"
            ? "Account created"
            : "Signed in",
      );
      await navigate({ to: "/dashboard", replace: true });
    },
    [authMode, inviteToken, navigate],
  );

  useEffect(() => {
    const oauthError = readOAuthCallbackError();
    if (oauthError) {
      setError(formatGoogleAuthError(oauthError));
      clearOAuthCallbackFromUrl(inviteToken ? { invite: inviteToken } : undefined);
      setOauthCompleting(false);
    }
  }, [inviteToken]);

  useEffect(() => {
    if (!hasOAuthCallbackInUrl()) return;

    let cancelled = false;
    setBusy(true);
    setOauthCompleting(true);
    setError(null);

    void (async () => {
      try {
        const session = await resolveAuthSession({ timeoutMs: 15000 });
        if (cancelled) return;

        clearOAuthCallbackFromUrl(inviteToken ? { invite: inviteToken } : undefined);

        if (!session?.user) {
          setError(
          formatGoogleAuthError(
            readOAuthCallbackError() ??
              "Google sign-in did not complete. Confirm Supabase redirect URLs include this site.",
          ),
        );
          return;
        }

        await finishAuth(session.user);
      } catch (err) {
        if (cancelled) return;
        setError(formatGoogleAuthError(err instanceof Error ? err.message : "Google sign-in failed"));
      } finally {
        if (!cancelled) {
          setBusy(false);
          setOauthCompleting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finishAuth, inviteToken]);

  useEffect(() => {
    enforceFounderModePolicy();
    if (founderMode) {
      setSessionReady(true);
      return;
    }

    return subscribeToAuthSession(async (session) => {
      if (session) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          await supabase.auth.signOut();
          syncFounderModeWithSession(false);
          setHasSession(false);
          setSessionReady(true);
          setError("Your session expired. Please sign in again.");
          return;
        }
      }
      syncFounderModeWithSession(Boolean(session));
      setHasSession(Boolean(session));
      setSessionReady(true);
    });
  }, [founderMode]);

  useEffect(() => {
    if (!founderMode || !sessionReady) return;
    void navigate({ to: "/dashboard", replace: true });
  }, [founderMode, sessionReady, navigate]);

  useEffect(() => {
    if (founderMode || !sessionReady || !hasSession || hasOAuthCallbackInUrl()) return;

    let cancelled = false;
    setBusy(true);

    void (async () => {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data.user) {
          await supabase.auth.signOut();
          setHasSession(false);
          return;
        }

        await completeAuthenticatedInvite(data.user, inviteToken);
        if (cancelled) return;
        toast.success(inviteToken ? "Invitation accepted" : "Signed in");
        await navigate({ to: "/dashboard", replace: true });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not complete invitation");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [founderMode, hasSession, inviteToken, navigate, sessionReady]);

  const pendingRedirect =
    (founderMode || hasSession) && sessionReady && !error && !oauthCompleting;

  if (pendingRedirect || oauthCompleting) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <p className="text-sm text-muted-foreground">
          {busy || oauthCompleting ? "Completing sign in..." : "Redirecting..."}
        </p>
      </main>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      disableFounderMode();

      if (authMode === "sign-up") {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: invitePreview?.full_name ?? undefined },
            emailRedirectTo: inviteToken
              ? `${window.location.origin}/auth?invite=${inviteToken}`
              : `${window.location.origin}/dashboard`,
          },
        });
        if (result.error) throw result.error;
        if (result.data.user && result.data.session) {
          await finishAuth(result.data.user);
          return;
        }
        toast.success("Check your email to confirm the account, then open the invite link again.");
        return;
      }

      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (result.data.user) {
        await finishAuth(result.data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!googleEnabled || googleBusy) return;

    setGoogleBusy(true);
    setError(null);
    disableFounderMode();
    const redirectPath = inviteToken ? `/auth?invite=${inviteToken}` : "/auth";
    const redirectTo = `${window.location.origin}${redirectPath}`;

    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (googleError) throw googleError;
      if (!data.url) {
        throw new Error("Google sign-in could not start. Try again or use email.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(
        formatGoogleAuthError(err instanceof Error ? err.message : "Google sign-in failed"),
      );
      setGoogleBusy(false);
    }
  };

  const enterFounderWorkspace = async () => {
    enableFounderMode();
    toast.success(`Founder access: ${FOUNDER_EMAIL}`);
    await navigate({ to: "/dashboard", replace: true });
  };

  return (
    <main className="grid min-h-screen bg-[linear-gradient(135deg,#f7faf8_0%,#e8fff6_34%,#eaf4ff_72%,#fff7e7_100%)] text-foreground dark:bg-[linear-gradient(135deg,#061014_0%,#0d2830_42%,#10203b_76%,#211a0f_100%)] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#07111f] text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(20,184,166,0.32),transparent_32%),radial-gradient(circle_at_80%_16%,rgba(59,130,246,0.24),transparent_28%),radial-gradient(circle_at_64%_82%,rgba(245,158,11,0.18),transparent_32%)]" />
        <img
          src="/marketing/project-organization.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-28 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#061014]/92 via-[#07111f]/82 to-[#061014]/94" />

        <div className="relative flex h-full min-h-screen flex-col justify-between p-10">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Public site
          </Link>

          <div className="max-w-xl">
            <div className="mb-8">
              <BrandWordmark size={48} suffixClassName="text-white" />
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
              <Fingerprint className="size-3.5" />
              Personal command system
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight xl:text-6xl">
              One secure entry into projects, tasks, decisions, and daily execution.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/68">
              1inow keeps the workspace focused: portfolio context, personal priorities, voice
              capture, and operational signals in one controlled system.
            </p>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <img
                src="/marketing/voice-capture.jpg"
                alt=""
                className="h-52 w-full rounded-[1.4rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.16),transparent_32%)] dark:bg-[radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.12),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.12),transparent_32%)]" />
        <div className="relative z-10 w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-4" />
            Public site
          </Link>

          <Card className="overflow-hidden border-white/70 bg-white/82 shadow-[0_32px_100px_-48px_color-mix(in_oklab,var(--foreground)_58%,transparent)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <div className="h-2 bg-gradient-to-r from-teal-400 via-blue-400 to-amber-300" />
            <CardHeader className="space-y-4">
              <BrandWordmark size={36} />
              <div>
                <CardTitle className="text-2xl">
                  {invitePreview ? "Accept your invitation" : "Sign in to 1inow"}
                </CardTitle>
                <CardDescription className="mt-2">
                  {invitePreview
                    ? `Join ${invitePreview.organization_name ?? "the workspace"} as ${invitationRoleLabel(invitePreview.role)}.`
                    : "Access your personal command center for projects, tasks, portfolio signals, and daily work."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {invitePreview && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm">
                  <div className="font-medium text-foreground">
                    {invitePreview.full_name || invitePreview.email}
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {invitePreview.organization_name ?? "1inow workspace"} ·{" "}
                    {invitationRoleLabel(invitePreview.role)}
                  </div>
                  {invitePreview.custom_message && (
                    <p className="mt-2 text-muted-foreground">{invitePreview.custom_message}</p>
                  )}
                </div>
              )}

              {inviteLoading && (
                <p className="text-sm text-muted-foreground">Loading invitation...</p>
              )}

              {!invitePreview && inviteToken && !inviteLoading && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  This invitation is invalid or expired.
                </div>
              )}

              {founderAccessAvailable && !invitePreview && (
                <Button
                  type="button"
                  className="w-full justify-between"
                  onClick={enterFounderWorkspace}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    Enter as Founder
                  </span>
                  <span className="text-xs opacity-80">{FOUNDER_EMAIL}</span>
                </Button>
              )}

              {googleEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-3"
                  disabled={googleBusy}
                  onClick={() => void signInWithGoogle()}
                >
                  <GoogleMark className="size-5 shrink-0 pointer-events-none" />
                  {googleBusy ? "Opening Google…" : "Continue with Google"}
                </Button>
              )}

              {(googleEnabled || (founderAccessAvailable && !invitePreview)) && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-[0.16em]">
                    <span className="bg-card px-3 text-muted-foreground">or email</span>
                  </div>
                </div>
              )}

              <form className="space-y-4" onSubmit={submit}>
                {invitePreview && (
                  <div className="flex rounded-xl border border-border p-1">
                    {(["sign-up", "sign-in"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          authMode === mode
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setAuthMode(mode)}
                      >
                        {mode === "sign-up" ? "Create account" : "Sign in"}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@company.com"
                    readOnly={Boolean(invitePreview?.email)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
                      placeholder={authMode === "sign-up" ? "Choose a password" : "Enter password"}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full justify-between"
                  disabled={busy || inviteLoading}
                >
                  <span>
                    {busy
                      ? "Working..."
                      : authMode === "sign-up"
                        ? "Create account and join"
                        : invitePreview
                          ? "Sign in and join"
                          : "Sign in with email"}
                  </span>
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <p className="text-center text-xs leading-5 text-muted-foreground">
                {googleEnabled
                  ? "Sign in with Google or your email."
                  : founderAccessAvailable
                    ? "Use Founder access or sign in with email."
                    : "Sign in with your email and password."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
