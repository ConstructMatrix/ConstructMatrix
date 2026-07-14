import { createServiceRoleClient } from "@/lib/supabase/server";
import { assignRole } from "./actions";

export default async function TeamPage() {
  const supabase = createServiceRoleClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-medium">Team</h1>
        <p className="text-sm text-text-muted mt-1">Manage user roles and access levels.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-surface-1 grid grid-cols-3 px-5 py-3 text-xs text-text-muted font-medium border-b border-border">
          <span>User</span>
          <span>Current role</span>
          <span>Change role</span>
        </div>
        {(users || []).length === 0 && (
          <div className="px-5 py-10 text-sm text-text-muted text-center">No users yet.</div>
        )}
        {(users || []).map((u) => (
          <div key={u.id} className="grid grid-cols-3 px-5 py-4 border-b border-border last:border-b-0 items-center">
            <div>
              <div className="text-sm font-medium">{u.full_name || u.email}</div>
              <div className="text-xs text-text-muted mt-0.5">{u.email}</div>
            </div>
            <div className="text-sm capitalize">{u.role || "—"}</div>
            <form action={assignRole}>
              <input type="hidden" name="userId" value={u.id} />
              <div className="flex gap-2">
                <select
                  name="role"
                  defaultValue={u.role || ""}
                  className="text-sm border border-border rounded px-2 py-1 flex-1"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="contractor">Contractor</option>
                </select>
                <button className="btn text-xs">Save</button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}