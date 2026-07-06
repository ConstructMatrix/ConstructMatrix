import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectQrPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single();
  if (!project) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signInUrl = `${baseUrl}/site/${project.slug}`;
  const qrDataUrl = await QRCode.toDataURL(signInUrl, { margin: 1, width: 240 });

  return (
    <div className="p-5">
      <div className="mb-5">
        <h1 className="text-base font-medium">QR sign-in</h1>
        <p className="text-xs text-text-muted mt-0.5 max-w-md">
          Workers scan this on-site. It opens the checklist and document upload in their browser — no app needed.
        </p>
      </div>

      <div className="flex gap-8 items-start flex-wrap">
        <div>
          <div className="card bg-surface-2 p-5 inline-block mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={120} height={120} alt={`QR code for ${project.name} sign-in`} />
          </div>
          <div className="text-[11px] text-text-muted mb-3">{signInUrl.replace(/^https?:\/\//, "")}</div>
          <div className="flex gap-2">
            <a href={qrDataUrl} download={`${project.slug}-qr.png`} className="btn text-xs">
              Download
            </a>
            <a href={signInUrl} target="_blank" rel="noreferrer" className="btn text-xs">
              Open link
            </a>
          </div>
        </div>

        <div className="flex-1 min-w-[220px]">
          <div className="text-[11px] text-text-muted font-medium uppercase tracking-wide mb-2">
            What workers see
          </div>
          <div className="card w-[220px] overflow-hidden">
            <div className="bg-surface-1 border-b border-border px-3 py-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
              <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
              <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
              <span className="text-[10px] text-text-muted ml-1">constructmatrix </span>
            </div>
            <div className="p-3.5">
              <h3 className="text-sm font-medium">{project.name}</h3>
              <p className="text-[11px] text-text-muted mb-3">Enter your email to continue</p>
              <div className="text-[11px] border border-border rounded px-2 py-1.5 text-text-muted mb-2">
                name@company.com
              </div>
              <div className="btn btn-primary justify-center flex text-[11px]">Continue</div>
              <div className="mt-3 text-[11px] text-text-muted border-t border-border pt-2.5 space-y-1">
                <div>✓ Complete site checklist</div>
                <div>✓ Upload credentials</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Returning workers skip re-entry — their previous records carry over.</p>
        </div>
      </div>
    </div>
  );
}
