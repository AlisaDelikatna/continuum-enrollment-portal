import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUSES, statusLabel } from "@/config/statuses";
import { prisma } from "@/lib/db";
import { documentProgress, formatDate } from "@/lib/enrollments";
import { getActingUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My employees — Continuum Fiscal Services" };

export default async function RepPage() {
  const actor = await getActingUser();

  if (!actor || actor.role !== "REP") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <div className="card card-pad">
          <h1 className="text-lg font-semibold text-slate-900">
            Representative workspace
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Switch to a representative in the header to see their employees.
            Representatives see only the employees assigned to them — never
            participants or vendors.
          </p>
        </div>
      </div>
    );
  }

  const employees = await prisma.enrollment.findMany({
    where: { repId: actor.id, type: "EMPLOYEE" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      documents: { select: { docKey: true } },
      statusEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, status: true, note: true },
      },
    },
  });

  const needsAttention = employees.filter((e) => e.status === "MISSING_INFO");
  const counts = new Map<string, number>();
  for (const employee of employees) {
    counts.set(employee.status, (counts.get(employee.status) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <p className="section-title">Representative</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        {actor.name}&apos;s employees
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {employees.length} employee{employees.length === 1 ? "" : "s"} assigned to you.
        You can upload documents on their behalf; only admin staff change statuses.
      </p>

      {needsAttention.length > 0 && (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-300">
          <p className="text-sm font-semibold text-amber-900">
            {needsAttention.length} employee{needsAttention.length === 1 ? "" : "s"} waiting on missing information
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {needsAttention.map((employee) => (
              <li key={employee.id}>
                <Link href={`/rep/${employee.id}`} className="font-medium underline">
                  {employee.name}
                </Link>
                {employee.statusEvents[0]?.note && (
                  <span className="text-amber-800"> — {employee.statusEvents[0].note}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <span
            key={status}
            className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200"
          >
            {statusLabel(status)}{" "}
            <span className="font-semibold text-slate-900">{counts.get(status) ?? 0}</span>
          </span>
        ))}
      </div>

      <div className="mt-6 card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">Employee</th>
                <th className="table-head">Participant</th>
                <th className="table-head">Program</th>
                <th className="table-head">Status</th>
                <th className="table-head">Documents</th>
                <th className="table-head">Submitted</th>
                <th className="table-head sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {employees.map((employee) => {
                const progress = documentProgress(
                  employee.type,
                  employee.documents.map((d) => d.docKey),
                );
                const complete = progress.complete === progress.total;
                return (
                  <tr key={employee.id} className="hover:bg-slate-50/70">
                    <td className="table-cell">
                      <Link
                        href={`/rep/${employee.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-700"
                      >
                        {employee.name}
                      </Link>
                      <span className="block font-mono text-xs text-slate-400">
                        {employee.refId}
                      </span>
                    </td>
                    <td className="table-cell">{employee.participantName ?? "—"}</td>
                    <td className="table-cell">{employee.program}</td>
                    <td className="table-cell">
                      <StatusBadge status={employee.status} size="sm" />
                    </td>
                    <td className="table-cell">
                      <span className={complete ? "text-emerald-700" : "text-amber-700"}>
                        {progress.complete}/{progress.total}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500">
                      {formatDate(employee.createdAt)}
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/rep/${employee.id}`}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No employees are assigned to you yet.
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
