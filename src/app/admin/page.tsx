import Link from "next/link";
import { Suspense } from "react";
import { AdminFilters } from "@/components/AdminFilters";
import { DigestButton } from "@/components/DigestButton";
import { StatusBadge } from "@/components/StatusBadge";
import { typeLabel } from "@/config/programs";
import { STATUSES, statusLabel } from "@/config/statuses";
import { prisma } from "@/lib/db";
import { dayBounds } from "@/lib/email";
import { documentProgress, formatDate } from "@/lib/enrollments";
import { getActingUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Continuum Fiscal Services" };

/** searchParams values can arrive repeated (?status=a&status=b); take the first. */
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage(props: PageProps<"/admin">) {
  const actor = await getActingUser();
  if (!actor || actor.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <div className="card card-pad">
          <h1 className="text-lg font-semibold text-slate-900">Admin workspace</h1>
          <p className="mt-2 text-sm text-slate-600">
            Switch to an admin user in the header to see every enrollee, change
            statuses and send the upload digest.
          </p>
        </div>
      </div>
    );
  }

  const raw = await props.searchParams;
  const filters = {
    type: one(raw.type),
    program: one(raw.program),
    status: one(raw.status),
    q: one(raw.q),
  };
  const where = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.program ? { program: filters.program } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q } },
            { email: { contains: filters.q } },
            { refId: { contains: filters.q } },
            { businessName: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const today = new Date();
  const { start, end } = dayBounds(today);

  const [enrollments, total, byStatus, uploadsToday] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        rep: { select: { name: true } },
        documents: { select: { docKey: true } },
        statusEvents: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
    }),
    prisma.enrollment.count(),
    prisma.enrollment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.document.count({ where: { createdAt: { gte: start, lt: end } } }),
  ]);

  const counts = new Map(byStatus.map((row) => [row.status, row._count._all]));
  const todayValue = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate(),
  ).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title">Admin</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Enrollment queue
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Every employee, vendor and participant across all five waiver programs.
          </p>
        </div>
        <Link href="/outbox" className="btn-secondary">
          Open outbox
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin?status=${status}`}
            className="card px-4 py-3 hover:ring-brand-300 transition"
          >
            <p className="text-2xl font-semibold text-slate-900">
              {counts.get(status) ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">{statusLabel(status)}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="card card-pad text-sm text-slate-500">Loading filters…</div>}>
            <AdminFilters total={total} shown={enrollments.length} />
          </Suspense>
        </div>
        <div className="card card-pad">
          <h2 className="section-title mb-3">Daily upload digest</h2>
          <DigestButton defaultDate={todayValue} uploadsToday={uploadsToday} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">Enrollee</th>
                <th className="table-head">Type</th>
                <th className="table-head">Program</th>
                <th className="table-head">Status</th>
                <th className="table-head">Rep</th>
                <th className="table-head">Docs</th>
                <th className="table-head">Submitted</th>
                <th className="table-head sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {enrollments.map((enrollment) => {
                const progress = documentProgress(
                  enrollment.type,
                  enrollment.documents.map((d) => d.docKey),
                );
                return (
                  <tr key={enrollment.id} className="hover:bg-slate-50/70">
                    <td className="table-cell">
                      <Link
                        href={`/admin/${enrollment.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-700"
                      >
                        {enrollment.businessName ?? enrollment.name}
                      </Link>
                      <span className="block font-mono text-xs text-slate-400">
                        {enrollment.refId} · {enrollment.email}
                      </span>
                    </td>
                    <td className="table-cell">{typeLabel(enrollment.type)}</td>
                    <td className="table-cell">{enrollment.program}</td>
                    <td className="table-cell">
                      <StatusBadge status={enrollment.status} size="sm" />
                    </td>
                    <td className="table-cell">
                      {enrollment.type === "EMPLOYEE" ? (
                        enrollment.rep ? (
                          enrollment.rep.name
                        ) : (
                          <span className="text-amber-700">Unassigned</span>
                        )
                      ) : (
                        <span className="text-slate-300">n/a</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span
                        className={
                          progress.complete === progress.total
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }
                      >
                        {progress.complete}/{progress.total}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500">
                      {formatDate(enrollment.createdAt)}
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/admin/${enrollment.id}`}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    No enrollments match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
