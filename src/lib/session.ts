import { cookies } from "next/headers";
import { prisma } from "./db";

/**
 * Demo "auth": a cookie holding the id of the seeded user we're acting as.
 * There is no password anywhere in this app — the header switcher is the login.
 */
export const ACTING_USER_COOKIE = "cfs_acting_user";

export type ActingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function getActingUser(): Promise<ActingUser | null> {
  const store = await cookies();
  const id = store.get(ACTING_USER_COOKIE)?.value;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

/** Everyone the switcher can impersonate, grouped for the dropdown. */
export async function getSwitchableUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      enrollments: { select: { type: true, refId: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    enrolleeType: u.enrollments[0]?.type ?? null,
    refId: u.enrollments[0]?.refId ?? null,
  }));
}
