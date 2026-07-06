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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm overflow-hidden">
        <div className="bg-surface-1 border-b border-border px-4 py-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
          <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
          <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
          <span className="text-[10px] text-text-muted ml-1">constructmatrix</span>
        </div>
        <div className="p-5">
          <h1 className="text-base font-medium">{project.name}</h1>
          {project.address && <p className="text-xs text-text-muted mb-3">{project.address}</p>}
          <SiteSignInForm projectSlug={project.slug} />
          <div className="mt-4 pt-3 border-t border-border text-xs text-text-muted space-y-1.5">
            <div>✓ Complete site checklist</div>
            <div>✓ Upload credentials</div>
          </div>
        </div>
      </div>
    </main>
  );
}