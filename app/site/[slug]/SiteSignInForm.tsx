"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SiteSignInForm({ projectSlug }: { projectSlug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function signInAndRedirect() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous sign-in failed:", error);
          setError("Couldn't start your session. Please try scanning the QR code again.");
          return;
        }
      }
      router.push(`/onboarding?project=${projectSlug}`);
    }
    signInAndRedirect();
  }, [projectSlug, router]);

  if (error) {
    return (
      <div className="alert alert-danger">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-muted">Starting your onboarding…</p>
    </div>
  );
}