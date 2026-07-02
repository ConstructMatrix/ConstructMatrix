import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteSignInForm from "./SiteSignInForm";

export default async function SiteSignInPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, address, slug")
    .eq("slug", params.slug)
    .single();

  if (!project) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm overflow-hidden">
        <div className="bg-surface-1 border-b border-border px-4 py-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
          <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
          <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
          <span className="text-[10px] text-text-muted ml-1">constructmatrix.app</span>
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
