"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate")) {
        setError("Too many sign-in attempts. Please wait a few minutes and try again.");
      } else {
        setError(error.message || "Something went wrong. Please try again.");
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
    <div className="card w-full max-w-sm p-6">
      <h1 className="text-lg font-medium mb-1">Administrator sign in</h1>
      <p className="text-xs text-text-muted mb-5">
      We&apos;ll send you a secure sign-in link.
      </p>

      {authErrorMessage && (
        <div className="bg-bg-danger border border-border-danger rounded p-2.5 mb-4">
          <p className="text-xs text-text-danger">{authErrorMessage}</p>
        </div>
      )}

      {sent ? (
        <div className="text-center">
          <div className="text-2xl mb-3">✉️</div>
          <p className="text-sm font-medium mb-1">Check your email</p>
          <p className="text-xs text-text-muted">
            We sent a sign-in link to <strong>{email}</strong>. Click it to continue — it expires in 1 hour.
          </p>
          <button
            onClick={() => { setSent(false); setError(null); }}
            className="text-xs text-text-muted mt-4 underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-b border-border bg-transparent text-sm pb-2 outline-none"
          />
          {error && (
            <div className="bg-bg-danger border border-border-danger rounded p-2.5">
              <p className="text-xs text-text-danger">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary justify-center flex">
            {loading ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}