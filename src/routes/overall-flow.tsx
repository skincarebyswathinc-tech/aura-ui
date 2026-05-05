import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/overall-flow")({
  component: OverallFlowPage,
  head: () => ({
    meta: [
      { title: "Overall Flow — System Map" },
      { name: "description", content: "End-to-end flow of the booking, payment, auth and resource system." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Step = {
  n: number;
  from: string;
  to: string;
  trigger: string;
  what: string;
  details?: string[];
};

const STEPS: Step[] = [
  {
    n: 1,
    from: "/ (Landing)",
    to: "/#book (Calendly embed)",
    trigger: "User clicks any 'Book consultation' CTA",
    what: "Anchor scroll to the inline Calendly widget on the landing page.",
    details: [
      "Calendly URL: https://calendly.com/skincarebyswathinc/derma-gut-consultation-15mins",
      "Embedded inline — no external redirect.",
    ],
  },
  {
    n: 2,
    from: "/#book (Calendly)",
    to: "/payment?email=…&start=…",
    trigger: "Calendly fires postMessage 'calendly.event_scheduled'",
    what: "Index route listens for the event, fetches invitee + event details from Calendly's public API, stores booking in sessionStorage, and navigates to /payment.",
    details: [
      "Captured: email, startTime, inviteeUri, eventUri.",
      "Booking is held (status='held') — not yet confirmed.",
    ],
  },
  {
    n: 3,
    from: "/payment",
    to: "Razorpay checkout (new tab)",
    trigger: "User clicks 'Pay INR 500 & confirm'",
    what: "Opens Razorpay payment link in a new tab. Original tab continues to auto-create the user account.",
    details: [
      "Razorpay URL: https://rzp.io/rzp/eldHb6v",
      "Amount: INR 500.",
    ],
  },
  {
    n: 4,
    from: "/payment",
    to: "Supabase Auth (signUp / signInWithOtp)",
    trigger: "Same click — runs in parallel with payment tab",
    what: "Auto-creates a Supabase user with a random password (no signup form). If the email already exists, sends a magic link instead.",
    details: [
      "New user → live session returned immediately (auto-confirm).",
      "Returning user → magic link email; UI shows 'Check your inbox'.",
    ],
  },
  {
    n: 5,
    from: "/payment",
    to: "/dashboard",
    trigger: "Successful signUp returns a session",
    what: "Auto-login complete. User lands directly on the dashboard — no extra form.",
  },
  {
    n: 6,
    from: "/login",
    to: "/dashboard",
    trigger: "Returning user enters email → magic link",
    what: "Email-only login for returning users. Clicking the magic link redirects to /dashboard.",
  },
  {
    n: 7,
    from: "/dashboard",
    to: "Supabase: resources table (RLS-gated)",
    trigger: "Dashboard mounts and queries resources",
    what: "Lists all resources. Public ones show a Download button; restricted ones show 'Locked' until the user has a completed booking (enforced by RLS via has_completed_booking()).",
  },
];

function OverallFlowPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-primary">
          ← Home
        </Link>

        <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">
          Overall Flow
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          End-to-end map of every endpoint the user touches — from landing to dashboard.
        </p>

        <div className="mt-10 space-y-4">
          {STEPS.map((s) => (
            <article
              key={s.n}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {s.n}
                </span>
                <div className="text-sm font-medium">
                  <code className="rounded bg-muted px-2 py-0.5 text-xs">{s.from}</code>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <code className="rounded bg-muted px-2 py-0.5 text-xs">{s.to}</code>
                </div>
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-primary">
                Trigger
              </p>
              <p className="mt-1 text-sm">{s.trigger}</p>

              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-primary">
                What happens
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.what}</p>

              {s.details && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {s.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-serif text-xl text-primary">Quick path</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <code>/</code> → Calendly slot → <code>/payment</code> → Razorpay + auto-signup → <code>/dashboard</code> → resources unlock after session is marked completed.
          </p>
        </div>
      </div>
    </div>
  );
}
