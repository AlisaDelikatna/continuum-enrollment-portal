import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { EnrollmentFacts } from "@/components/EnrollmentFacts";
import { MissingInfoBanner } from "@/components/MissingInfoBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusProgress, StatusTimeline } from "@/components/StatusTimeline";
import { UploadForm } from "@/components/UploadForm";
import { documentsFor } from "@/config/documents";
import { prisma } from "@/lib/db";
import { documentProgress, programCodes, programList } from "@/lib/enrollments";
import { getActingUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RepEmployeePage(props: PageProps<"/rep/[id]">) {
  const { id } = await props.params;
  const actor = await getActingUser();

  if (!actor || actor.role !== "REP") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <div className="card card-pad">
          <h1 className="text-lg font-semibold text-slate-900">Not your workspace</h1>
          <p className="mt-2 text-sm text-slate-600">
            Switch to a representative in the header to open this record.
          </p>
        </div>
      </div>
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      programs: { select: { program: true } },
      rep: { select: { name: true, email: true } },
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

  // Reps see only their own employees — never participants or vendors.
  if (!enrollment || enrollment.type !== "EMPLOYEE" || enrollment.repId !== actor.id) {
    notFound();
  }

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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-6">
      <Link href="/rep" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← All my employees
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {enrollment.name}
          </h1>
          <StatusBadge status={enrollment.status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-mono">{enrollment.refId}</span> · {programList(enrollment)}
          {enrollment.participantName && <> · works for {enrollment.participantName}</>}
        </p>
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

      <div className="card card-pad">
        <h2 className="section-title mb-4">Employee details</h2>
        <EnrollmentFacts enrollment={enrollment} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 card card-pad">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="section-title">Documents</h2>
            <span className="text-xs font-medium text-slate-500">
              {progress.complete} of {progress.total} required received
            </span>
          </div>
          <div className="mt-4">
            <DocumentChecklist
              type={enrollment.type}
              documents={enrollment.documents}
              programs={codes}
            />
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Upload on behalf of {enrollment.name}
            </h3>
            <p className="mt-1 mb-4 text-xs text-slate-500">
              Your name is recorded as the uploader on the document and on the admin
              daily digest.
            </p>
            <UploadForm
              enrollmentId={enrollment.id}
              documents={documentsFor(enrollment.type, codes)}
              onBehalfOf={enrollment.name}
            />
          </div>
        </div>

        <div className="lg:col-span-2 card card-pad">
          <h2 className="section-title mb-4">Status history</h2>
          <StatusTimeline events={enrollment.statusEvents} />
          <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Status changes are made by Continuum admin staff. You and{" "}
            {enrollment.name} are both emailed whenever this record moves.
          </p>
        </div>
      </div>
    </div>
  );
}
