import Link from "next/link";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { EnrollmentFacts } from "@/components/EnrollmentFacts";
import { MissingInfoBanner } from "@/components/MissingInfoBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusProgress, StatusTimeline } from "@/components/StatusTimeline";
import { UploadForm } from "@/components/UploadForm";
import { documentsFor } from "@/config/documents";
import { prisma } from "@/lib/db";
import { documentProgress, formatDateTime, programCodes } from "@/lib/enrollments";
import { getActingUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My enrollment — Continuum Fiscal Services" };

export default async function MePage() {
  const actor = await getActingUser();

  if (!actor) {
    return (
      <Notice title="Pick who you are">
        Use the <strong>Acting as</strong> switcher in the header to sign in as an
        enrollee, or <Link className="text-brand-600 underline" href="/enroll">start a new enrollment</Link>.
      </Notice>
    );
  }

  if (actor.role !== "ENROLLEE") {
    return (
      <Notice title="This page belongs to enrollees">
        You are acting as {actor.name} ({actor.role.toLowerCase()}). Switch to an
        enrollee in the header, or go to{" "}
        <Link className="text-brand-600 underline" href={actor.role === "ADMIN" ? "/admin" : "/rep"}>
          your own workspace
        </Link>
        .
      </Notice>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { enrolleeId: actor.id },
    orderBy: { createdAt: "desc" },
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

  if (enrollments.length === 0) {
    return (
      <Notice title="No enrollment on file">
        We have your account but no enrollment yet.{" "}
        <Link className="text-brand-600 underline" href="/enroll">
          Start one now
        </Link>
        .
      </Notice>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-10">
      {enrollments.map((enrollment) => {
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
        const lastUpdate = enrollment.statusEvents[0];

        return (
          <div key={enrollment.id} className="space-y-6">
            <div>
              <p className="section-title">My enrollment</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {enrollment.name}
                </h1>
                <StatusBadge status={enrollment.status} />
              </div>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-mono">{enrollment.refId}</span>
                {lastUpdate && <> · last updated {formatDateTime(lastUpdate.createdAt)}</>}
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
              <h2 className="section-title mb-4">Enrollment details</h2>
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
                  <h3 className="text-sm font-semibold text-slate-900">Upload a document</h3>
                  <p className="mt-1 mb-4 text-xs text-slate-500">
                    Accepted any time — nothing is emailed per upload, admin staff get
                    one daily summary.
                  </p>
                  <UploadForm
                    enrollmentId={enrollment.id}
                    documents={documentsFor(enrollment.type, codes)}
                  />
                </div>
              </div>

              <div className="lg:col-span-2 card card-pad">
                <h2 className="section-title mb-4">Status history</h2>
                <StatusTimeline events={enrollment.statusEvents} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <div className="card card-pad">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{children}</p>
      </div>
    </div>
  );
}
