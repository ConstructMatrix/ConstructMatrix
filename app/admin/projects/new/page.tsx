import { createProject } from "../actions";
import PageHeader from "@/components/PageHeader";

export default function NewProjectPage({ searchParams }: { searchParams: { error?: string } }) {
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

        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
          <input type="checkbox" name="useDefaults" defaultChecked className="rounded" />
          Start from the default checklist and document template
        </label>
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