import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { documentsFor } from "@/config/documents";
import { ENROLLEE_TYPES, TYPE_BLURBS, TYPE_LABELS } from "@/config/programs";
import { STATUSES, statusLabel } from "@/config/statuses";
import { prisma } from "@/lib/db";
import { documentProgress, formatDate, programCodes, programList } from "@/lib/enrollments";
import { getActingUser, type ActingUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * The landing page is role-aware. A signed-out visitor is a member of the
 * public: they get the intake path and nothing about anyone's caseload.
 * Operational numbers only appear for the people entitled to them.
 */
export default async function HomePage() {
  const actor = await getActingUser();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <Hero actor={actor} />
      {actor === null && <PublicLanding />}
      {actor?.role === "ENROLLEE" && <EnrolleeLanding actor={actor} />}
      {actor?.role === "REP" && <RepLanding actor={actor} />}
      {actor?.role === "ADMIN" && <AdminLanding />}
    </div>
  );
}

function Hero({ actor }: { actor: ActingUser | null }) {
  const workspace =
    actor?.role === "ADMIN" ? "/admin" : actor?.role === "REP" ? "/rep" : "/me";

  return (
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
          <Link href={workspace} className="btn-secondary">
            Continue as {actor.name}
          </Link>
        ) : (
          <span className="self-center text-sm text-slate-500">
            Already enrolled? Pick your name in the header to sign in.
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Public — no record counts, no internal links                      */
/* ---------------------------------------------------------------- */

function PublicLanding() {
  return (
    <>
      <section className="mt-10">
        <h2 className="section-title">Who can enroll</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {ENROLLEE_TYPES.map((type) => (
            <Link
              key={type}
              href="/enroll"
              className="card card-pad hover:ring-brand-300 hover:shadow transition"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {TYPE_LABELS[type]}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{TYPE_BLURBS[type]}</p>
              <p className="mt-4 text-sm font-semibold text-brand-600">
                {documentsFor(type).filter((d) => d.required).length} required
                documents →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 card card-pad">
        <h2 className="section-title">What happens after you apply</h2>
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
          You are emailed at every step. If anything is missing from your packet
          we say exactly what it is, and you can upload it from your status page
          without starting over.
        </p>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Enrollee — their own record only                                  */
/* ---------------------------------------------------------------- */

async function EnrolleeLanding({ actor }: { actor: ActingUser }) {
  const enrollments = await prisma.enrollment.findMany({
    where: { enrolleeId: actor.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      refId: true,
      type: true,
      programs: { select: { program: true } },
      status: true,
      createdAt: true,
      documents: { select: { docKey: true } },
    },
  });

  if (enrollments.length === 0) {
    return (
      <section className="mt-10 card card-pad">
        <h2 className="text-base font-semibold text-slate-900">
          No enrollment on file yet
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          We have your account but nothing submitted.{" "}
          <Link href="/enroll" className="text-brand-600 underline">
            Start your enrollment
          </Link>
          .
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="section-title">Your enrollment</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {enrollments.map((enrollment) => {
          const progress = documentProgress(
            enrollment.type,
            enrollment.documents.map((d) => d.docKey),
            programCodes(enrollment),
          );
          return (
            <Link
              key={enrollment.id}
              href="/me"
              className="card card-pad hover:ring-brand-300 hover:shadow transition"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm text-slate-500">
                  {enrollment.refId}
                </span>
                <StatusBadge status={enrollment.status} />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {TYPE_LABELS[enrollment.type as keyof typeof TYPE_LABELS] ??
                  enrollment.type}{" "}
                · {programList(enrollment)} · submitted{" "}
                {formatDate(enrollment.createdAt)}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {progress.complete} of {progress.total} required documents received
              </p>
              <p className="mt-4 text-sm font-semibold text-brand-600">
                View status and upload →
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Rep — their own caseload only                                     */
/* ---------------------------------------------------------------- */

async function RepLanding({ actor }: { actor: ActingUser }) {
  const employees = await prisma.enrollment.findMany({
    where: { repId: actor.id, type: "EMPLOYEE" },
    select: { status: true },
  });

  const counts = new Map<string, number>();
  for (const employee of employees) {
    counts.set(employee.status, (counts.get(employee.status) ?? 0) + 1);
  }
  const attention = counts.get("MISSING_INFO") ?? 0;

  return (
    <section className="mt-10">
      <h2 className="section-title">Your caseload</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Stat label="Employees assigned to you" value={employees.length} />
        <Stat label="Waiting on missing information" value={attention} />
      </div>

      <div className="mt-4 card card-pad">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((status) => (
            <div key={status} className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-2xl font-semibold text-slate-900">
                {counts.get(status) ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">{statusLabel(status)}</p>
            </div>
          ))}
        </div>
        <Link
          href="/rep"
          className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Open my employees →
        </Link>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Admin — the whole operation                                       */
/* ---------------------------------------------------------------- */

const ADMIN_DESTINATIONS = [
  {
    href: "/admin",
    title: "Enrollment queue",
    body: "Every enrollee, filters, status changes with notes, rep assignment, daily digest.",
  },
  {
    href: "/outbox",
    title: "Outbox",
    body: "Every notification the portal generated — nothing is sent to a real inbox.",
  },
  {
    href: "/enroll",
    title: "Enrollment form",
    body: "The public three-step intake, as an applicant sees it.",
  },
];

async function AdminLanding() {
  const [total, byType, byStatus, documents] = await Promise.all([
    prisma.enrollment.count(),
    prisma.enrollment.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.enrollment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.document.count(),
  ]);

  const statusCounts = new Map(byStatus.map((row) => [row.status, row._count._all]));
  const typeCounts = new Map(byType.map((row) => [row.type, row._count._all]));

  return (
    <>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Enrollments on file" value={total} />
        <Stat label="Employees" value={typeCounts.get("EMPLOYEE") ?? 0} />
        <Stat
          label="Vendors & participants"
          value={(typeCounts.get("VENDOR") ?? 0) + (typeCounts.get("PARTICIPANT") ?? 0)}
        />
        <Stat label="Documents received" value={documents} />
      </div>

      <section className="mt-10 card card-pad">
        <h2 className="section-title">Pipeline</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin?status=${status}`}
              className="rounded-lg bg-slate-50 px-3 py-3 hover:bg-slate-100 transition"
            >
              <p className="text-2xl font-semibold text-slate-900">
                {statusCounts.get(status) ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">{statusLabel(status)}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Every transition is stored with its timestamp, the staff member who made
          it, and a note — so the existing enrollment dashboard can query how long
          records sit at each step.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="section-title">Where to go</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {ADMIN_DESTINATIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card card-pad hover:ring-brand-300 hover:shadow transition"
            >
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              <p className="mt-3 text-sm font-semibold text-brand-600">
                {item.href} →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
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
