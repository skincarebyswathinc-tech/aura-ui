import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Maison Clinique — Luxury Aesthetic Medicine" },
      {
        name: "description",
        content:
          "A premium clinical practice offering refined, results-led aesthetic care in a serene, private setting.",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
    ],
  }),
});

function GoldButton({
  children,
  variant = "solid",
}: {
  children: React.ReactNode;
  variant?: "solid" | "ghost";
}) {
  if (variant === "ghost") {
    return (
      <button
        type="button"
        className="inline-flex h-12 items-center justify-center rounded-lg border border-primary/40 px-6 text-sm font-medium tracking-wide text-primary transition-colors hover:bg-primary/10"
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_8px_24px_-12px_rgba(200,169,106,0.6)] transition-all hover:brightness-110 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:py-8">
        <div className="font-serif text-xl tracking-wide text-foreground">
          Maison<span className="text-primary"> · </span>Clinique
        </div>
        <nav className="hidden items-center gap-10 text-sm text-muted-foreground md:flex">
          <a href="#" className="transition-colors hover:text-foreground">Treatments</a>
          <a href="#" className="transition-colors hover:text-foreground">Practitioners</a>
          <a href="#" className="transition-colors hover:text-foreground">Journal</a>
          <a href="#" className="transition-colors hover:text-foreground">Contact</a>
        </nav>
        <div className="hidden md:block">
          <GoldButton>Book consultation</GoldButton>
        </div>
        <button
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span className="block h-px w-5 bg-foreground" />
            <span className="block h-px w-5 bg-foreground" />
          </div>
        </button>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6">
        <section className="grid grid-cols-1 gap-16 py-20 sm:py-28 lg:grid-cols-12 lg:gap-12 lg:py-40">
          <div className="lg:col-span-7">
            <p className="mb-8 text-xs uppercase tracking-[0.3em] text-primary">
              Est. Geneva — 2014
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Considered care,
              <br />
              <em className="not-italic text-primary">quietly</em> delivered.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A private clinical practice for those who value precision, discretion
              and natural, lasting results. Every protocol is bespoke.
            </p>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
              <GoldButton>Book a consultation</GoldButton>
              <GoldButton variant="ghost">View treatments</GoldButton>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Signature protocol
              </p>
              <h2 className="mt-4 font-serif text-2xl text-foreground sm:text-3xl">
                The Maison Facial
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A 90-minute clinical ritual combining medical-grade resurfacing,
                lymphatic sculpting and bespoke serums.
              </p>

              <dl className="mt-8 space-y-4 border-t border-border pt-6 text-sm">
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="text-foreground">90 minutes</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Recovery</dt>
                  <dd className="text-foreground">None</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">From</dt>
                  <dd className="font-serif text-lg text-primary">CHF 680</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 Maison Clinique. All rights reserved.</p>
          <p className="tracking-[0.2em] uppercase">Geneva · London · Zürich</p>
        </div>
      </footer>
    </div>
  );
}
