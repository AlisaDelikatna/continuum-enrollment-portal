import Link from "next/link";
import { STATUSES, statusLabel } from "@/config/statuses";
import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/db";
import { getActingUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const DESTINATIONS = [
  {
    href: "/enroll",
    title: "Enroll",
    body: "Public three-step intake for employees, vendors and participants.",
    audience: "Anyone",
  },
  {
    href: "/me",
    title: "My enrollment",
    body: "Status timeline, outstanding items and document upload for the enrollee.",
    audience: "Enrollees",
  },
  {
    href: "/rep",
    title: "My employees",
    body: "A representative's caseload, each employee's status, and uploads on their behalf.",
    audience: "Representatives",
  },
  {
    href: "/admin",
    title: "Admin queue",
    body: "Every enrollee, filters, status changes with notes, rep assignment, daily digest.",
    audience: "Admin staff",
  },
  {
    href: "/outbox",
    title: "Outbox",
    body: "Every notification the portal generated — nothing is sent to a real inbox.",
    audience: "Demo tool",
  },
];

export default async function HomePage() {
  const [actor, total, byType, byStatus, pendingDocs] = await Promise.all([
    getActingUser(),
    prisma.enrollment.count(),
    prisma.enrollment.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.enrollment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.document.count(),
  ]);

  const statusCounts = new Map(byStatus.map((row) => [row.status, row._count._all]));
  const typeCounts = new Map(byType.map((row) => [row.type, row._count._all]));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="section-title">Continuum Fiscal Services</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Enrollment portal for Georgia self-directed waiver programs
        </h1>
        <p className="mt-4 text-base text-slate-600">
          One intake path for employees, vendors and participants across COMP, NOW,
          CCSP, SOURCE and ICWP — with a timestamped status history behind every
          record, documents in one place, and every notification captured for review.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/enroll" className="btn-primary">
            Start an enrollment
          </Link>
          {actor ? (
            <Link
              href={actor.role === "ADMIN" ? "/admin" : actor.role === "REP" ? "/rep" : "/me"}
              className="btn-secondary"
            >
              Continue as {actor.name}
            </Link>
          ) : (
            <span className="self-center text-sm text-slate-500">
              Pick a user in the header to sign in.
            </span>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Enrollments on file" value={total} />
        <Stat label="Employees" value={typeCounts.get("EMPLOYEE") ?? 0} />
        <Stat
          label="Vendors & participants"
          value={(typeCounts.get("VENDOR") ?? 0) + (typeCounts.get("PARTICIPANT") ?? 0)}
        />
        <Stat label="Documents received" value={pendingDocs} />
      </div>

      <section className="mt-10 card card-pad">
        <h2 className="section-title">Pipeline</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((status) => (
            <div key={status} className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-2xl font-semibold text-slate-900">
                {statusCounts.get(status) ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">{statusLabel(status)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-title">Where to go</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card card-pad hover:ring-brand-300 hover:shadow transition"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {item.audience}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              <p className="mt-3 text-sm font-semibold text-brand-600">
                {item.href} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 card card-pad">
        <h2 className="section-title">Status model</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {STATUSES.map((status, index) => (
            <span key={status} className="flex items-center gap-2">
              <StatusBadge status={status} />
              {index < STATUSES.length - 1 && (
                <span aria-hidden className="text-slate-300">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Every transition is stored with its timestamp, the staff member who made
          it, and a note — so the existing enrollment dashboard can query how long
          records sit at each step.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
