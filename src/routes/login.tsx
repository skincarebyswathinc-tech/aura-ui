import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign in" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    // If already signed in, go straight to dashboard.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (otpErr) {
      setError(otpErr.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-md">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-primary">
          ← Back
        </Link>

        <h1 className="mt-8 font-serif text-4xl leading-tight sm:text-5xl">
          Sign in
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Enter your email — we'll send you a secure sign-in link.
        </p>

        {status === "sent" ? (
          <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <p className="font-serif text-xl text-primary">Check your inbox</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a sign-in link to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_8px_24px_-12px_rgba(200,169,106,0.6)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send sign-in link"}
            </button>
            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
