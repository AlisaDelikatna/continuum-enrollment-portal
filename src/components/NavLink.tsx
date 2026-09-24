"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-md px-3 py-1.5 text-sm font-semibold text-white bg-white/10 ring-1 ring-inset ring-white/20"
          : "rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5"
      }
    >
      {children}
    </Link>
  );
}
