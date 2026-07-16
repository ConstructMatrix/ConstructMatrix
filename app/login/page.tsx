"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";
  const authError = params.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://atconstructmatrix.com/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(error.message || "Failed to send sign-in link. Please try again.");
      }
    } else {
      setSent(true);
    }
  }

  const authErrorMessage =
    authError === "not_authorized"
      ? "That account doesn't have administrator or manager access."
      : authError === "link_expired"
      ? "Your sign-in link has expired. Please request a new one."
      : authError === "auth_error"
      ? "Something went wrong with your sign-in link. Please try again."
      : null;

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Administrator sign in</h1>
      <p className="text-sm text-text-muted mb-6">
        We&apos;ll send you a secure sign-in link to your email.
      </p>

      {authErrorMessage && (
        <div className="alert alert-danger mb-5">
          <p>{authErrorMessage}</p>
        </div>
      )}

      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-brand-light border border-brand-muted flex items-center justify-center text-2xl mx-auto mb-4">
            ✉️
          </div>
          <p className="text-base font-semibold mb-2">Check your email</p>
          <p className="text-sm text-text-muted leading-relaxed">
            We sent a sign-in link to <strong className="text-text-primary">{email}</strong>. Click it to continue — it expires in 1 hour.
          </p>
          <button
            onClick={() => { setSent(false); setError(null); }}
            className="btn btn-ghost text-sm mt-6"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="label">Email address</label>
            <input
              id="email"
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          {error && (
            <div className="alert alert-danger">
              <p>{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 mt-1">
            {loading ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-0">
      <div className="mb-8">
        <Logo href="/" size="md" />
      </div>
      <Suspense fallback={<div className="card w-full max-w-md p-8 animate-pulse h-64" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
