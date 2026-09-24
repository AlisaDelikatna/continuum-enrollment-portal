import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { EnrollmentFacts } from "@/components/EnrollmentFacts";
import { MissingInfoBanner } from "@/components/MissingInfoBanner";
import { RepAssignForm } from "@/components/RepAssignForm";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusChangeForm } from "@/components/StatusChangeForm";
import { StatusProgress, StatusTimeline } from "@/components/StatusTimeline";
import { UploadForm } from "@/components/UploadForm";
import { documentsFor } from "@/config/documents";
import { typeLabel } from "@/config/programs";
import { prisma } from "@/lib/db";
import { documentProgress, missingDocuments, programCodes, programList } from "@/lib/enrollments";
import { getActingUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminDetailPage(props: PageProps<"/admin/[id]">) {
  const { id } = await props.params;
  const actor = await getActingUser();

  if (!actor || actor.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <div className="card card-pad">
          <h1 className="text-lg font-semibold text-slate-900">Admin only</h1>
          <p className="mt-2 text-sm text-slate-600">
            Switch to an admin user in the header to open this record.
          </p>
        </div>
      </div>
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      programs: { select: { program: true } },
      rep: { select: { id: true, name: true, email: true } },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true, role: true } } },
      },
      statusEvents: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true, role: true } } },
      },
    },
  });
  if (!enrollment) notFound();

  const reps = await prisma.user.findMany({
    where: { role: "REP" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { repEnrollments: true } },
    },
  });

  const missing =
    enrollment.status === "MISSING_INFO"
      ? enrollment.statusEvents.find((e) => e.status === "MISSING_INFO")
      : null;
  const codes = programCodes(enrollment);
  const progress = documentProgress(
    enrollment.type,
    enrollment.documents.map((d) => d.docKey),
    codes,
  );
  const outstanding = missingDocuments(
    enrollment.type,
    enrollment.documents.map((d) => d.docKey),
    codes,
  );

  const recipientsHint =
    enrollment.type === "EMPLOYEE"
      ? `${enrollment.email} + rep ${enrollment.rep?.email ?? enrollment.repEmailRaw ?? "(none assigned)"}`
      : enrollment.email;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
      <Link href="/admin" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Enrollment queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {enrollment.businessName ?? enrollment.name}
            </h1>
            <StatusBadge status={enrollment.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-mono">{enrollment.refId}</span> ·{" "}
            {typeLabel(enrollment.type)} · {programList(enrollment)}
          </p>
        </div>
      </div>

      <div className="card card-pad">
        <StatusProgress current={enrollment.status} />
      </div>

      {missing?.note && (
        <MissingInfoBanner
          note={missing.note}
          at={missing.createdAt}
          by={missing.changedBy?.name}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card card-pad">
            <h2 className="section-title mb-4">Enrollment details</h2>
            <EnrollmentFacts enrollment={enrollment} />
          </div>

          <div className="card card-pad">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="section-title">Documents</h2>
              <span className="text-xs font-medium text-slate-500">
                {progress.complete} of {progress.total} required received
              </span>
            </div>
            {outstanding.length > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
                Outstanding: {outstanding.map((d) => d.label).join(", ")}
              </p>
            )}
            <div className="mt-4">
              <DocumentChecklist
                type={enrollment.type}
                documents={enrollment.documents}
                programs={codes}
              />
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Upload on behalf of this enrollee
              </h3>
              <p className="mt-1 mb-4 text-xs text-slate-500">
                For documents that arrive by fax or mail.
              </p>
              <UploadForm
                enrollmentId={enrollment.id}
                documents={documentsFor(enrollment.type, codes)}
                onBehalfOf={enrollment.name}
              />
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="section-title mb-4">Status history</h2>
            <StatusTimeline events={enrollment.statusEvents} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-pad">
            <h2 className="section-title mb-4">Change status</h2>
            <StatusChangeForm
              enrollmentId={enrollment.id}
              currentStatus={enrollment.status}
              recipientsHint={recipientsHint}
            />
          </div>

          {enrollment.type === "EMPLOYEE" && (
            <div className="card card-pad">
              <h2 className="section-title mb-4">Representative</h2>
              <RepAssignForm
                enrollmentId={enrollment.id}
                currentRepId={enrollment.rep?.id ?? null}
                typedRep={enrollment.repNameRaw ?? enrollment.repEmailRaw}
                reps={reps.map((rep) => ({
                  id: rep.id,
                  name: rep.name,
                  email: rep.email,
                  caseload: rep._count.repEnrollments,
                }))}
              />
            </div>
          )}

          <div className="card card-pad">
            <h2 className="section-title mb-3">Notification rules</h2>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <strong className="text-slate-800">Status change:</strong>{" "}
                {enrollment.type === "EMPLOYEE"
                  ? "the employee and their assigned rep."
                  : `the ${typeLabel(enrollment.type).toLowerCase()} only.`}
              </li>
              <li>
                <strong className="text-slate-800">Document upload:</strong> no
                individual email — it appears on the admin daily digest.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
