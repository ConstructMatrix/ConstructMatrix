"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect") || "/admin";
        router.push(redirect);
      } else {
        // Wait for session to be established from hash
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get("redirect") || "/admin";
            router.push(redirect);
          } else if (event === "SIGNED_OUT" || !session) {
            router.push("/login?error=link_expired");
          }
        });
      }
    };

    checkSession();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-text-muted">Signing you in…</p>
    </main>
  );
}