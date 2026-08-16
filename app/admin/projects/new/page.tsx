import { createClient } from "@/lib/supabase/server";
import { createProject } from "../actions";
import PageHeader from "@/components/PageHeader";

export default async function NewProjectPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("id, name")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-lg mx-auto">
      <PageHeader
        title="New project"
        subtitle="Create a new construction project worksite."
      />
      {searchParams.error && (
        <div className="alert alert-danger mb-5">
          <p>{searchParams.error}</p>
        </div>
      )}
      <form action={createProject} className="card p-6 flex flex-col gap-5">
        <LabeledInput name="name" label="Project name" required placeholder="Downtown Core" />
        <LabeledInput name="slug" label="URL slug (used in the QR code)" required placeholder="downtown-core" />
        <LabeledInput name="address" label="Site address" placeholder="100 King St W, Toronto, ON" />
        <LabeledInput name="description" label="Description" placeholder="High-rise commercial build, phase 2" />

        <div>
          <label className="label">Starting checklist</label>
          <select name="template" className="select w-full" defaultValue="default">
            <option value="default">Default checklist</option>
            {(templates || []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value="none">Start blank</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full py-2.5 mt-1">
          Create project
        </button>
      </form>
    </div>
  );
}

function LabeledInput({
  name,
  label,
  required,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="label">{label}</div>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}