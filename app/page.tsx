import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-medium mb-2">Construct Matrix</h1>
        <p className="text-sm text-text-muted mb-8">
          Employee credential tracking, onboarding & project management.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/login" className="btn btn-primary justify-center flex">
            Admin / site manager sign in
          </Link>
          <Link href="/site/downtown-core" className="btn justify-center flex">
            Employee demo QR sign-in 
          </Link>
        </div>
      </div>
    </main>
  );
}
