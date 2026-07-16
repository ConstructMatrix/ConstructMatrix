"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("Redirecting…");
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect") || "/admin";
        // Small delay to ensure cookie is set
        setTimeout(() => {
          window.location.href = redirect;
        }, 500);
      } else if (event === "INITIAL_SESSION" && !session) {
        router.push("/login?error=link_expired");
      }
    });
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-text-muted">{status}</p>
    </main>
  );
}