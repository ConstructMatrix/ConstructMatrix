import { createServiceRoleClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import { assignRole } from "./actions";

export default async function TeamPage() {
  const supabase = createServiceRoleClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 ">
      <PageHeader title="Team" subtitle="Manage user roles and access levels." />

      <div className="card overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-3 bg-surface-1 border-b border-border text-xs font-medium text-text-muted uppercase tracking-wide">
          <span>User</span>
          <span>Current role</span>
          <span>Change role</span>
        </div>
        {(users || []).length === 0 && (
          <div className="px-4 py-10 text-sm text-text-muted text-center">No users yet.</div>
        )}
        {(users || []).map((u) => (
          <div key={u.id} className="grid grid-cols-3 px-4 py-4 border-b border-border last:border-b-0 items-center">
            <div>
              <div className="text-sm font-semibold">{u.full_name || u.email}</div>
              <div className="text-xs text-text-muted mt-0.5">{u.email}</div>
            </div>
            <div className="text-sm capitalize">
              <span className="pill">{u.role || "—"}</span>
            </div>
            <form action={assignRole}>
              <input type="hidden" name="userId" value={u.id} />
              <div className="flex gap-2">
                <select
                  name="role"
                  defaultValue={u.role || ""}
                  className="select flex-1 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Onboarding Manager</option>
                  <option value="contractor">Contractor</option>
                </select>
                <button className="btn text-sm">Save</button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}