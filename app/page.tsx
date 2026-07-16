import Link from "next/link";
import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-2/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Logo size="md" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-muted">
            Construction site onboarding
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-text-primary mb-4 leading-tight">
            Get workers on site, faster and safer
          </h1>
          <p className="text-base text-text-muted mb-10 leading-relaxed">
            Track credentials, manage checklists, and verify compliance — all from one platform built for construction teams.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Link href="/login" className="btn btn-primary px-6 py-3 text-sm">
              Admin / site manager sign in
            </Link>
            <Link href="/site/downtown-core" className="btn px-6 py-3 text-sm">
              Employee demo QR sign-in
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-left">
            <FeatureCard icon="📋" title="Site checklists" description="Digital orientation forms with supervisor sign-off" />
            <FeatureCard icon="📄" title="Credential tracking" description="Upload and verify licenses, certs, and IDs" />
            <FeatureCard icon="📱" title="QR onboarding" description="Workers scan on-site — no app download needed" />
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-6 text-center text-xs text-text-muted">
        Construct Matrix · Employee credential tracking & project management
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card p-4">
      <div className="feature-icon mb-3">{icon}</div>
      <div className="text-sm font-semibold text-text-primary mb-1">{title}</div>
      <div className="text-xs text-text-muted leading-relaxed">{description}</div>
    </div>
  );
}
