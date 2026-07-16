"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import SignOutButton from "./SignOutButton";

const LINKS = [
  { href: "/admin", label: "Dashboard", match: (p: string) => p === "/admin" },
  { href: "/admin/projects", label: "Projects", match: (p: string) => p.startsWith("/admin/projects") },
  { href: "/admin/history", label: "History", match: (p: string) => p.startsWith("/admin/history") },
  { href: "/admin/team", label: "Team", match: (p: string) => p.startsWith("/admin/team"), adminOnly: true },
];

export default function AdminNav({
  userName,
  userRole,
  isAdmin,
}: {
  userName: string;
  userRole: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-2/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14 gap-1">
          <div className="pr-4 mr-2 border-r border-border">
            <Logo href="/admin" size="sm" />
          </div>

          <nav className="flex items-center gap-0.5">
            {LINKS.filter((l) => !l.adminOnly || isAdmin).map((link) => {
              const active = link.match(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    active
                      ? "bg-brand-light text-brand"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-1"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-text-primary leading-tight">{userName}</div>
              <div className="text-xs text-text-muted capitalize">{userRole}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
