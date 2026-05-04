import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Your dashboard" }],
  }),
});

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function DashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [booking, setBooking] = useState<{ email?: string; startTime?: string }>({});

  useEffect(() => {
    // Subscribe FIRST, then read existing session — avoids race conditions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (checked && !session) {
      navigate({ to: "/login" });
    }
  }, [checked, session, navigate]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("booking");
      if (raw) setBooking(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (!checked || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 sm:py-8">
        <Link to="/" className="font-serif text-xl tracking-wide">
          Maison<span className="text-primary"> · </span>Clinique
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Welcome</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
          Your consultation is confirmed.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          Signed in as <strong className="text-foreground">{session.user.email}</strong>.
        </p>

        <div className="mt-12 rounded-2xl border border-border bg-card p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Upcoming consultation
          </p>
          <h2 className="mt-3 font-serif text-2xl">45-Minute Private Consultation</h2>
          <dl className="mt-6 space-y-4 border-t border-border pt-6 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">When</dt>
              <dd className="text-right font-medium">
                {formatTime(booking.startTime) || "Details sent to your inbox"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-serif text-primary">Confirmed</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
