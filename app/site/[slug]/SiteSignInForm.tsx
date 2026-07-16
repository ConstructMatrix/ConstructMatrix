"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SiteSignInForm({ projectSlug }: { projectSlug: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://atconstructmatrix.com/auth/callback?redirect=${encodeURIComponent(`/onboarding?project=${projectSlug}`)}`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message || "Failed to send sign-in link. Please try again.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="alert alert-success">
        <p className="text-sm">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">Enter your email to continue</p>
      <input
        type="email"
        required
        placeholder="name@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input"
      />
      {error && (
        <div className="alert alert-danger">
          <p className="text-sm">{error}</p>
        </div>
      )}
      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Sending…" : "Continue"}
      </button>
    </form>
  );
}
