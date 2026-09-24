import Link from "next/link";
import { NavLink } from "./NavLink";
import { RoleSwitcher } from "./RoleSwitcher";
import { getActingUser, getSwitchableUsers } from "@/lib/session";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "Admin",
  REP: "Representative",
  ENROLLEE: "Enrollee",
};

export async function Header() {
  const [actor, users] = await Promise.all([getActingUser(), getSwitchableUsers()]);
  const role = actor?.role ?? null;

  return (
    <header className="bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white font-bold tracking-tight"
            >
              CF
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-white">
                Continuum Fiscal Services
              </span>
              <span className="block text-[11px] text-slate-400">
                Enrollment Portal
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/enroll">Enroll</NavLink>
            {role === "ENROLLEE" && <NavLink href="/me">My enrollment</NavLink>}
            {role === "REP" && <NavLink href="/rep">My employees</NavLink>}
            {role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
            {role === "ADMIN" && <NavLink href="/outbox">Outbox</NavLink>}
          </nav>

          <div className="flex items-center gap-3">
            {actor && (
              <span className="hidden lg:inline rounded-full bg-brand-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-200 ring-1 ring-inset ring-brand-500/30">
                {ROLE_BADGE[actor.role] ?? actor.role}
              </span>
            )}
            <RoleSwitcher users={users} currentId={actor?.id ?? null} />
          </div>
        </div>

        <nav className="flex md:hidden items-center gap-1 pb-3 -mt-1 overflow-x-auto">
          <NavLink href="/enroll">Enroll</NavLink>
          {role === "ENROLLEE" && <NavLink href="/me">My enrollment</NavLink>}
          {role === "REP" && <NavLink href="/rep">My employees</NavLink>}
          {role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
          {role === "ADMIN" && <NavLink href="/outbox">Outbox</NavLink>}
        </nav>
      </div>
    </header>
  );
}
