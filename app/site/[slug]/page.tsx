import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import SiteSignInForm from "./SiteSignInForm";

export default async function SiteSignInPage({ params }: { params: { slug: string } }) {
  console.log("SLUG:", params.slug);
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SERVICE KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const supabase = createServiceRoleClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, address, slug")
    .eq("slug", params.slug)
    .single();

  console.log("PROJECT:", project, "ERROR:", error);

  if (!project) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-surface-0">
      <div className="card w-full max-w-sm overflow-hidden shadow-md">
        <div className="browser-chrome">
          <span className="browser-dot" />
          <span className="browser-dot" />
          <span className="browser-dot" />
          <span className="text-xs text-text-muted ml-2">constructmatrix.com</span>
        </div>
        <div className="p-6">
          <div className="w-10 h-10 rounded-lg bg-brand text-white font-bold text-sm flex items-center justify-center mb-4">
            CM
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
          {project.address && <p className="text-sm text-text-muted mt-1 mb-5">{project.address}</p>}
          <SiteSignInForm projectSlug={project.slug} />
          <div className="mt-6 pt-5 border-t border-border space-y-2">
            <StepItem label="Complete site checklist" />
            <StepItem label="Upload credentials" />
          </div>
        </div>
      </div>
    </main>
  );
}

function StepItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-text-muted">
      <span className="w-5 h-5 rounded-full bg-bg-success text-text-success flex items-center justify-center text-xs flex-shrink-0">✓</span>
      {label}
    </div>
  );
}
