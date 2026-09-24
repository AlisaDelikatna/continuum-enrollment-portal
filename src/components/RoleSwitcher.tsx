"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActingUser } from "@/lib/actions";
import { typeLabel } from "@/config/programs";

type SwitchUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  enrolleeType: string | null;
  refId: string | null;
};

const ROLE_ORDER = ["ADMIN", "REP", "ENROLLEE"] as const;
const ROLE_GROUP_LABEL: Record<string, string> = {
  ADMIN: "Admin staff",
  REP: "Representatives",
  ENROLLEE: "Enrollees",
};

/**
 * Stands in for real auth: pick any seeded user and the whole app re-renders
 * as that person. The choice is kept in a cookie.
 */
export function RoleSwitcher({
  users,
  currentId,
}: {
  users: SwitchUser[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const landingFor = (user: SwitchUser | undefined) => {
    if (!user) return "/";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "REP") return "/rep";
    return "/me";
  };

  return (
    <label className="flex items-center gap-2">
      <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Acting as
      </span>
      <select
        aria-label="Acting as"
        disabled={pending}
        value={currentId ?? ""}
        onChange={(event) => {
          const id = event.target.value;
          const form = new FormData();
          form.set("userId", id);
          const next = landingFor(users.find((u) => u.id === id));
          startTransition(async () => {
            await setActingUser(form);
            router.push(next);
            router.refresh();
          });
        }}
        className="max-w-[16rem] sm:max-w-[22rem] truncate rounded-lg border-0 bg-white/10 py-1.5 pl-3 pr-8 text-sm font-medium text-white
          ring-1 ring-inset ring-white/20 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60
          [&>optgroup]:text-slate-900 [&>option]:text-slate-900"
      >
        <option value="">Signed out (public visitor)</option>
        {ROLE_ORDER.map((role) => {
          const group = users.filter((u) => u.role === role);
          if (group.length === 0) return null;
          return (
            <optgroup key={role} label={ROLE_GROUP_LABEL[role]}>
              {group.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                  {user.enrolleeType ? ` — ${typeLabel(user.enrolleeType)}` : ""}
                  {user.refId ? ` (${user.refId})` : ""}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}
