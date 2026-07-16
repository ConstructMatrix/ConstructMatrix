"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  useEffect(() => {
    const supabase = createClient();

    // Check immediately first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const params = new URLSearchParams(window.location.search);
        const redirect = decodeURIComponent(params.get("redirect") || "/admin");
        window.location.href = redirect;
        return;
      }

      // If no session yet, wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          const params = new URLSearchParams(window.location.search);
          const redirect = decodeURIComponent(params.get("redirect") || "/admin");
          window.location.href = redirect;
        } else if (event === "INITIAL_SESSION" && !session) {
          window.location.href = "/login?error=link_expired";
        }
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-text-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-text-muted">Signing you in…</p>
      </div>
    </main>
  );
}