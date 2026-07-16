import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import ProjectTabs from "../../../ProjectTabs";

export default async function ProjectQrPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single();
  if (!project) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signInUrl = `${baseUrl}/site/${project.slug}`;
  const qrDataUrl = await QRCode.toDataURL(signInUrl, { margin: 1, width: 280 });

  return (
    <div className="p-6">
      <PageHeader
        title="QR sign-in"
        subtitle="Workers scan this on-site. It opens the checklist and document upload in their browser — no app needed."
      />
      <ProjectTabs projectId={project.id} active="qr" />

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div>
          <div className="card p-6 inline-block mb-4 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={200} height={200} alt={`QR code for ${project.name} sign-in`} className="rounded" />
          </div>
          <div className="text-sm text-text-muted mb-4 font-mono bg-surface-1 px-3 py-2 rounded-lg inline-block">
            {signInUrl.replace(/^https?:\/\//, "")}
          </div>
          <div className="flex gap-2">
            <a href={qrDataUrl} download={`${project.slug}-qr.png`} className="btn">
              Download PNG
            </a>
            <a href={signInUrl} target="_blank" rel="noreferrer" className="btn">
              Open link
            </a>
          </div>
        </div>

        <div className="flex-1 min-w-[240px]">
          <div className="section-label">What workers see</div>
          <div className="card w-[260px] overflow-hidden shadow-md">
            <div className="browser-chrome">
              <span className="browser-dot" />
              <span className="browser-dot" />
              <span className="browser-dot" />
              <span className="text-xs text-text-muted ml-2">constructmatrix.com</span>
            </div>
            <div className="p-5">
              <div className="w-8 h-8 rounded-lg bg-brand text-white font-bold text-xs flex items-center justify-center mb-3">
                CM
              </div>
              <h3 className="text-sm font-semibold">{project.name}</h3>
              <p className="text-xs text-text-muted mb-4 mt-1">Enter your email to continue</p>
              <div className="text-xs border border-border rounded-lg px-3 py-2 text-text-muted mb-3 bg-surface-1">
                name@company.com
              </div>
              <div className="btn btn-primary justify-center flex text-xs py-2">Continue</div>
              <div className="mt-4 text-xs text-text-muted border-t border-border pt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-bg-success text-text-success flex items-center justify-center text-[10px]">✓</span>
                  Complete site checklist
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-bg-success text-text-success flex items-center justify-center text-[10px]">✓</span>
                  Upload credentials
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-text-muted mt-4 leading-relaxed max-w-xs">
            Returning workers skip re-entry — their previous records carry over.
          </p>
        </div>
      </div>
    </div>
  );
}
