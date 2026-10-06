import type { ReactNode } from "react";

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-white text-ink shadow-[0_0_40px_-6px_rgba(182,156,255,0.8)] hover:bg-lavender"
      : "border border-white/40 text-white hover:border-lavender hover:text-lavender";
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-bold transition-colors ${styles}`}
    >
      {children}
    </a>
  );
}
