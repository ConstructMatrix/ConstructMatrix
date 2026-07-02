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
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="card w-full max-w-sm p-6">
      <h1 className="text-lg font-medium mb-1">Administrator sign in</h1>
      <p className="text-xs text-text-muted mb-5">
        Enter your email. We&apos;ll send you a secure sign-in link — no password needed.
      </p>

      {authError === "not_authorized" && (
        <p className="text-xs text-text-danger mb-3">
          That account doesn&apos;t have administrator or site manager access.
        </p>
      )}

      {sent ? (
        <p className="text-sm">
          Check <strong>{email}</strong> for a sign-in link.
        </p>
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
          {error && <p className="text-xs text-text-danger">{error}</p>}
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
