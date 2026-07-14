import { createProject } from "../actions";

export default function NewProjectPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-medium mb-1">New project</h1>
      <p className="text-sm text-text-muted mb-6">Create a new construction project worksite.</p>
      {searchParams.error && <p className="text-xs text-text-danger mb-3">{searchParams.error}</p>}
      <form action={createProject} className="card p-5 flex flex-col gap-4">
        <LabeledInput name="name" label="Project name" required placeholder="Downtown Core" />
        <LabeledInput name="slug" label="URL slug (used in the QR code)" required placeholder="downtown-core" />
        <LabeledInput name="address" label="Site address" placeholder="100 King St W, Toronto, ON" />
        <LabeledInput name="description" label="Description" placeholder="High-rise commercial build, phase 2" />

        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Onboarding type</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 border border-border rounded-lg p-3 cursor-pointer has-[:checked]:border-text-primary has-[:checked]:bg-surface-1">
              <div className="flex items-center gap-2">
                <input type="radio" name="onboarding_type" value="external" defaultChecked />
                <span className="text-sm font-medium">External</span>
              </div>
              <span className="text-[11px] text-text-muted pl-5">Site supervisor onboards contractors, subcontractors, consultants on arrival</span>
            </label>
            <label className="flex flex-col gap-1 border border-border rounded-lg p-3 cursor-pointer has-[:checked]:border-text-primary has-[:checked]:bg-surface-1">
              <div className="flex items-center gap-2">
                <input type="radio" name="onboarding_type" value="internal" />
                <span className="text-sm font-medium">Internal</span>
              </div>
              <span className="text-[11px] text-text-muted pl-5">HR onboards internal employees and tracks training expiry dates</span>
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" name="useDefaults" defaultChecked />
          Start from the default checklist and document template
        </label>
        <button type="submit" className="btn btn-primary justify-center flex mt-1">
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
      <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{label}</div>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="text-sm border border-border rounded px-2 py-1.5 w-full outline-none"
      />
    </label>
  );
}