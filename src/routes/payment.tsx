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

const RAZORPAY_URL = "https://rzp.io/rzp/eldHb6v";
const PRICE_INR = 1000;

function generatePassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) + "Aa1!";
}

function PaymentPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "magic-sent" | "error">("idle");
  const [error, setError] = useState<string>("");

  // Pre-fill email from Calendly redirect / sessionStorage
  useEffect(() => {
    let prefEmail = search.email || "";
    try {
      const raw = sessionStorage.getItem("booking");
      if (raw) {
        const stored = JSON.parse(raw);
        if (!prefEmail && stored.email) prefEmail = stored.email;
      }
    } catch {
      // ignore
    }
    if (prefEmail) setEmail(prefEmail);
  }, [search.email]);

  function handleOpenPayment() {
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    window.open(RAZORPAY_URL, "_blank", "noopener,noreferrer");
    setPaymentOpened(true);
  }

  async function handleConfirmPaid() {
    setError("");
    if (!paidConfirmed) {
      setError("Please confirm you have completed the payment.");
      return;
    }
    setStatus("processing");

    // Persist name for downstream display
    try {
      const raw = sessionStorage.getItem("booking");
      const prev = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(
        "booking",
        JSON.stringify({ ...prev, email, name, paidAt: new Date().toISOString() }),
      );
    } catch {
      // ignore
    }

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password: generatePassword(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name },
      },
    });

    if (signUpErr) {
      const looksLikeExisting = /registered|already|exists/i.test(signUpErr.message);
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
          Enter your details and complete payment to confirm.
        </p>

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
            <div className="mt-10 space-y-5 rounded-2xl border border-border bg-card p-8">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <div className="flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-serif text-2xl text-primary">INR {PRICE_INR}</span>
              </div>
            </div>

            {!paymentOpened ? (
              <button
                type="button"
                onClick={handleOpenPayment}
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_8px_24px_-12px_rgba(200,169,106,0.6)] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Pay INR {PRICE_INR} & confirm
              </button>
            ) : (
              <div className="mt-8 space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-6">
                <p className="text-sm text-muted-foreground">
                  Payment opened in a new tab. Once you've completed the payment,
                  confirm below to access your dashboard.
                </p>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={paidConfirmed}
                    onChange={(e) => setPaidConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    I confirm I have successfully paid <strong>INR {PRICE_INR}</strong> via Razorpay.
                  </span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => window.open(RAZORPAY_URL, "_blank", "noopener,noreferrer")}
                    className="flex-1 rounded-lg border border-primary/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/10"
                  >
                    Reopen payment
                  </button>
                  <button
                    type="button"
                    disabled={status === "processing" || !paidConfirmed}
                    onClick={handleConfirmPaid}
                    className="flex-1 rounded-lg bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-50"
                  >
                    {status === "processing" ? "Verifying…" : "I've paid — continue"}
                  </button>
                </div>
              </div>
            )}

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
