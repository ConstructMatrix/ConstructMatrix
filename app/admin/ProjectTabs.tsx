import Link from "next/link";

const TABS = [
  { slug: "workers", label: "Workers", href: (id: string) => `/admin/projects/${id}/workers` },
  { slug: "config", label: "Configuration", href: (id: string) => `/admin/projects/${id}` },
  { slug: "qr", label: "QR sign-in", href: (id: string) => `/admin/projects/${id}/qr` },
];

export default function ProjectTabs({
  projectId,
  active,
}: {
  projectId: string;
  active: "workers" | "config" | "qr";
}) {
  return (
    <div className="tab-nav">
      {TABS.map((tab) => (
        <Link
          key={tab.slug}
          href={tab.href(projectId)}
          className={`tab-link ${active === tab.slug ? "tab-link-active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
