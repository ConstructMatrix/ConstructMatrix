"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Exchange session for server-readable cookies
        await fetch("/api/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
        window.location.href = "/admin";
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await fetch("/api/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          });
          window.location.href = "/admin";
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