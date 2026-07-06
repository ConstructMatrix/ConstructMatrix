import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name, role").eq("id", user!.id).single();

  return (
    <div>
      <nav className="flex items-center border-b border-border bg-surface-1 px-4 gap-0">
        <span className="text-[12px] font-medium tracking-wide text-text-muted pr-4 border-r border-border mr-2">
          CONSTRUCT MATRIX
        </span>
        <Link href="/admin" className="text-[13px] px-3.5 py-2.5 text-text-muted hover:text-text-primary">
          Dashboard
        </Link>
        <Link href="/admin/projects" className="text-[13px] px-3.5 py-2.5 text-text-muted hover:text-text-primary">
          Projects
        </Link>
        <Link href="/admin/history" className="text-[13px] px-3.5 py-2.5 text-text-muted hover:text-text-primary">
          History
        </Link>
        <div className="ml-auto flex items-center gap-3 py-1.5">
          <span className="text-[11px] text-text-muted">
            {profile?.full_name || user?.email} · {profile?.role}
          </span>
          <SignOutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
