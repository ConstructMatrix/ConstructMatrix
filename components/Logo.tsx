import Link from "next/link";

export default function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: "w-7 h-7 text-sm", text: "text-sm" },
    md: { icon: "w-8 h-8 text-base", text: "text-base" },
    lg: { icon: "w-10 h-10 text-lg", text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <div
        className={`${s.icon} rounded-lg bg-brand text-white font-bold flex items-center justify-center shadow-sm group-hover:bg-brand-hover transition-colors`}
      >
        CM
      </div>
      <span className={`${s.text} font-semibold tracking-tight text-text-primary`}>
        Construct Matrix
      </span>
    </Link>
  );
}
