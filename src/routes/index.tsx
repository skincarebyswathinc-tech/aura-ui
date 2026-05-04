import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Fix the Root Cause — Private Clinical Consultation" },
      {
        name: "description",
        content:
          "A 45-minute private consultation to identify and address the root cause — not just the symptoms.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
    ],
  }),
});

// TODO: replace with your real Calendly event URL, e.g.
// "https://calendly.com/your-handle/45min"
const CALENDLY_URL = "https://calendly.com/acme/30min";

const BOOKING_HREF = "#book";

function GoldButton({
  children,
  href = BOOKING_HREF,
  variant = "solid",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-semibold tracking-wide transition-all active:scale-[0.98]";
  const styles =
    variant === "solid"
      ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_rgba(200,169,106,0.6)] hover:brightness-110"
      : "border border-primary/40 text-primary hover:bg-primary/10";
  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </a>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-1 h-4 w-4 flex-none text-primary"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

/**
 * Inline Calendly embed with event capture.
 * - Loads Calendly's widget.js once.
 * - Listens for postMessage events from the iframe.
 * - On `event_scheduled`, fetches the invitee details (email + start time)
 *   from Calendly's public API, stores them, then navigates to /payment.
 * - Stays inside the page — no new tabs, no external redirects.
 */
function CalendlyInline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Inject Calendly script once
    const SCRIPT_ID = "calendly-widget-script";
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const isCalendlyEvent = (e: MessageEvent) =>
      typeof e.data === "object" &&
      e.data !== null &&
      typeof (e.data as { event?: unknown }).event === "string" &&
      (e.data as { event: string }).event.indexOf("calendly.") === 0;

    const handleMessage = async (e: MessageEvent) => {
      if (!isCalendlyEvent(e)) return;
      const payload = e.data as {
        event: string;
        payload?: {
          event?: { uri?: string };
          invitee?: { uri?: string };
        };
      };

      if (payload.event !== "calendly.event_scheduled") return;

      const inviteeUri = payload.payload?.invitee?.uri;
      const eventUri = payload.payload?.event?.uri;

      let email = "";
      let startTime = "";

      // Calendly's invitee/event URIs are public REST endpoints that return
      // the booking details immediately after scheduling.
      try {
        if (inviteeUri) {
          const res = await fetch(inviteeUri);
          if (res.ok) {
            const data = await res.json();
            email = data?.resource?.email ?? "";
          }
        }
        if (eventUri) {
          const res = await fetch(eventUri);
          if (res.ok) {
            const data = await res.json();
            startTime = data?.resource?.start_time ?? "";
          }
        }
      } catch {
        // Network/CORS edge case — still continue to /payment with whatever we have.
      }

      const booking = {
        email,
        startTime,
        inviteeUri: inviteeUri ?? "",
        eventUri: eventUri ?? "",
        scheduledAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem("booking", JSON.stringify(booking));
      } catch {
        // ignore storage errors (private mode, etc.)
      }

      navigate({
        to: "/payment",
        search: { email, start: startTime },
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  // Calendly reads data-url and theme params from this div
  return (
    <div
      ref={containerRef}
      className="calendly-inline-widget w-full"
      data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=171A20&text_color=FFFFFF&primary_color=C8A96A`}
      style={{ minWidth: "280px", height: "720px" }}
    />
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:py-8">
        <div className="font-serif text-xl tracking-wide">
          Maison<span className="text-primary"> · </span>Clinique
        </div>
        <div className="hidden md:block">
          <GoldButton>Book consultation</GoldButton>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* 1. HERO */}
        <section className="py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-8 text-xs uppercase tracking-[0.3em] text-primary">
              Root-cause clinical care
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Fix the <em className="not-italic text-primary">Root Cause.</em>
              <br />
              Not the Symptoms.
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A focused 45-minute consultation to uncover what's actually driving
              your condition — and a clear plan to resolve it.
            </p>
            <div className="mt-12 flex justify-center">
              <GoldButton>Book your consultation</GoldButton>
            </div>
          </div>
        </section>

        {/* 2. OFFER CARD */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 sm:p-10">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              The consultation
            </p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
              45-Minute Private Consultation
            </h2>
            <ul className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <li className="flex gap-3">
                <CheckIcon />
                <span>In-depth review of your history and current symptoms</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Root-cause assessment — not surface-level fixes</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>A clear, personalised plan you can act on immediately</span>
              </li>
            </ul>
            <div className="mt-10">
              <GoldButton className="w-full">Reserve your slot</GoldButton>
            </div>
          </div>
        </section>

        {/* 3. CALENDLY (inline, full width) */}
        <section id="book" className="py-16 sm:py-20">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">Choose a time</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Select a slot — booking happens right here on this page.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <CalendlyInline />
          </div>
        </section>

        {/* 4. TRUST */}
        <section className="py-16 sm:py-20">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Case studies</p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Real outcomes</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                tag: "Chronic fatigue",
                title: "From bedridden to running again in 14 weeks",
                detail:
                  "Identified mitochondrial dysfunction missed by three previous clinicians.",
              },
              {
                tag: "Hormonal acne",
                title: "Clear skin in 9 weeks — no antibiotics",
                detail:
                  "Resolved underlying insulin and androgen imbalance at the source.",
              },
              {
                tag: "Migraines",
                title: "From 12 episodes a month to zero",
                detail:
                  "Targeted the cervical and dietary triggers driving the pattern.",
              },
            ].map((c) => (
              <article
                key={c.title}
                className="rounded-2xl border border-border bg-card p-8"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  {c.tag}
                </p>
                <h3 className="mt-4 font-serif text-xl leading-snug">{c.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {c.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* 5. URGENCY STRIP */}
        <section className="py-12">
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-5 text-center text-sm tracking-wide text-foreground sm:text-base">
            <span className="text-primary">●</span>{" "}
            Only <span className="font-semibold text-primary">3 consultation slots</span>{" "}
            remaining this month.
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
              Ready to stop guessing?
            </h2>
            <p className="mt-6 text-base text-muted-foreground sm:text-lg">
              Book your 45-minute consultation and leave with a real plan.
            </p>
            <div className="mt-10 flex justify-center">
              <GoldButton>Book your consultation</GoldButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10">
        <div className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
          © 2026 Maison Clinique
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <GoldButton className="w-full">Book consultation</GoldButton>
      </div>
    </div>
  );
}
