import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Digital Invest OS" }] }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.47 1.18 4.95l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.15 14.97 1 12 1A11 11 0 0 0 2.18 7.05L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can sign in now.");
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-background/10 grid place-items-center">
            <div className="size-3.5 rounded-full border-2 border-accent" />
          </div>
          <span className="font-semibold tracking-tight">Digital Invest OS</span>
        </div>
        <div className="space-y-5 max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight text-balance">
            One workspace. <span className="text-accent">Unlimited projects.</span>
          </h1>
          <p className="text-primary-foreground/70 text-pretty leading-relaxed">
            The operating system for Digital Invest — projects, tasks, teams, documents,
            communication and reporting, unified.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary-foreground/50">
          <div className="size-1.5 rounded-full bg-accent animate-pulse" />
          Secure · Real-time · Enterprise-grade
        </div>
        <div aria-hidden className="absolute -bottom-32 -right-32 size-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your Digital Invest workspace.
            </p>
          </div>

          <Button onClick={handleGoogle} variant="outline" className="w-full">
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email-in">Email</Label>
                  <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@digitalinvest.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pwd-in">Password</Label>
                  <Input id="pwd-in" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Michael Kofman" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-up">Email</Label>
                  <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pwd-up">Password</Label>
                  <Input id="pwd-up" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  The first account on this workspace becomes Super Admin.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}