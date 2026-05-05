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
  const [resources, setResources] = useState<Array<{ id: string; title: string; description: string | null; kind: string; url: string | null; is_public: boolean }>>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

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

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      setResourcesLoading(true);
      const { data } = await supabase
        .from("resources")
        .select("id, title, description, kind, url, is_public")
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setResources(data ?? []);
        setResourcesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

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
          <h2 className="mt-3 font-serif text-2xl">15-Minute Derma & Gut Consultation</h2>
          <dl className="mt-6 space-y-4 border-t border-border pt-6 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">When</dt>
              <dd className="text-right font-medium">
                {formatTime(booking.startTime) || "See your Calendly confirmation email"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-serif text-primary">Confirmed</dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Your booking link
            </p>
            <a
              href="https://calendly.com/skincarebyswathinc/derma-gut-consultation-15mins"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-lg border border-primary/40 px-5 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/10"
            >
              Open / reschedule on Calendly
            </a>
          </div>
        </div>

        {/* Resources / Downloads */}
        <section className="mt-12">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl">Your resources</h2>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Downloads
            </p>
          </div>

          {resourcesLoading ? (
            <p className="text-sm text-muted-foreground">Loading resources…</p>
          ) : resources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Resources will appear here after your consultation.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {resources.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.title}</p>
                    {r.description && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                  </div>
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-none rounded-lg border border-primary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/10"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="flex-none text-xs uppercase tracking-wide text-muted-foreground">
                      Locked
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
