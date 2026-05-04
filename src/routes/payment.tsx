import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type PaymentSearch = {
  email?: string;
  start?: string;
};

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>): PaymentSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
    start: typeof search.start === "string" ? search.start : undefined,
  }),
  component: PaymentPage,
  head: () => ({
    meta: [
      { title: "Confirm your consultation — Payment" },
      { name: "description", content: "Complete payment to confirm your booking." },
    ],
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

function PaymentPage() {
  const search = Route.useSearch();
  const [stored, setStored] = useState<{ email?: string; startTime?: string }>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("booking");
      if (raw) setStored(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const email = search.email || stored.email || "";
  const startTime = search.start || stored.startTime || "";

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-primary">
          ← Back
        </Link>

        <h1 className="mt-8 font-serif text-4xl leading-tight sm:text-5xl">
          Confirm your booking
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          Your slot is held. Complete payment to confirm.
        </p>

        <div className="mt-10 space-y-4 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-right font-medium">{email || "—"}</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <span className="text-sm text-muted-foreground">Time</span>
            <span className="text-right font-medium">{formatTime(startTime) || "—"}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-serif text-2xl text-primary">CHF 680</span>
          </div>
        </div>

        <button
          type="button"
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_8px_24px_-12px_rgba(200,169,106,0.6)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Pay & confirm
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Secure payment. You will not be redirected externally.
        </p>
      </div>
    </div>
  );
}
