import { createProject } from "../actions";

export default function NewProjectPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="p-5 max-w-md">
      <h1 className="text-base font-medium mb-4">New project</h1>
      {searchParams.error && <p className="text-xs text-text-danger mb-3">{searchParams.error}</p>}
      <form action={createProject} className="card p-4 flex flex-col gap-3">
        <LabeledInput name="name" label="Project name" required placeholder="Downtown Core" />
        <LabeledInput name="slug" label="URL slug (used in the QR code)" required placeholder="downtown-core" />
        <LabeledInput name="address" label="Site address" placeholder="100 King St W, Toronto, ON" />
        <LabeledInput name="description" label="Description" placeholder="High-rise commercial build, phase 2" />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" name="useDefaults" defaultChecked />
          Start from the default ECCL-style checklist and document template
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
