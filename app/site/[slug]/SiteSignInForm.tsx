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
      <p className="text-xs">
        We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-xs text-text-muted mb-1">Enter your email to continue</p>
      <input
        type="email"
        required
        placeholder="name@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="text-xs border border-border rounded px-2 py-2 outline-none w-full"
      />
      {error && <p className="text-xs text-text-danger">{error}</p>}
      <button type="submit" disabled={loading} className="btn btn-primary justify-center flex text-xs">
        {loading ? "Sending…" : "Continue"}
      </button>
    </form>
  );
}