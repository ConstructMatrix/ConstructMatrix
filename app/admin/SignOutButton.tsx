"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost text-sm px-3 py-1.5"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
      }}
    >
      Sign out
    </button>
  );
}
