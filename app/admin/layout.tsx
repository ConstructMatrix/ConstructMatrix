import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name, role").eq("id", user!.id).single();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-surface-0">
      <AdminNav
        userName={profile?.full_name || user?.email || "User"}
        userRole={profile?.role || "user"}
        isAdmin={isAdmin}
      />
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
