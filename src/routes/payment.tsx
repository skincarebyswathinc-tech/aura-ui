import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// Random URL-safe password — never shown to the user.
// Returning users sign in via magic link instead.
function generatePassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) + "Aa1!";
}

function PaymentPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [stored, setStored] = useState<{ email?: string; startTime?: string }>({});
  const [status, setStatus] = useState<"idle" | "paying" | "processing" | "magic-sent" | "error">("idle");
  const [error, setError] = useState<string>("");

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

  async function handleConfirm() {
    if (!email) {
      setError("Missing email — please choose a booking slot first.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("processing");

    // Auto-create + auto-login. Email confirmation is disabled in auth config,
    // so successful signUp returns a live session immediately.
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password: generatePassword(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (signUpErr) {
      // Returning user — account already exists. Send a magic link to log in.
      const looksLikeExisting =
        /registered|already|exists/i.test(signUpErr.message);
      if (looksLikeExisting) {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (otpErr) {
          setError(otpErr.message);
          setStatus("error");
          return;
        }
        setStatus("magic-sent");
        return;
      }
      setError(signUpErr.message);
      setStatus("error");
      return;
    }

    if (data.session) {
      navigate({ to: "/dashboard" });
      return;
    }

    // Fallback: no session returned (shouldn't happen with auto-confirm on)
    setStatus("magic-sent");
  }

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
            <span className="font-serif text-2xl text-primary">INR 500</span>
          </div>
        </div>

        {status === "magic-sent" ? (
          <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <p className="font-serif text-xl text-primary">Check your inbox</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a secure sign-in link to <strong>{email}</strong>. Click it to
              access your dashboard.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={status === "processing"}
              onClick={handleConfirm}
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_8px_24px_-12px_rgba(200,169,106,0.6)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {status === "processing" ? "Processing…" : "Pay & confirm"}
            </button>
            {error && (
              <p className="mt-4 text-center text-sm text-destructive">{error}</p>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Your account is created automatically — no password needed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
