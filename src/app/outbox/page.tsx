import Link from "next/link";
import { prisma } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { formatDateTime } from "@/lib/enrollments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Outbox — Continuum Fiscal Services" };

const KIND_LABELS: Record<string, string> = {
  STATUS_CHANGE: "Status change",
  UPLOAD_DIGEST: "Daily upload digest",
  ENROLLMENT_RECEIVED: "Enrollment received",
};

const KIND_STYLES: Record<string, string> = {
  STATUS_CHANGE: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  UPLOAD_DIGEST: "bg-brand-50 text-brand-700 ring-brand-200",
  ENROLLMENT_RECEIVED: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default async function OutboxPage(props: PageProps<"/outbox">) {
  // The outbox is the system-wide notification log: it contains every
  // enrollee's name, address and status notes. Admin staff only — a rep must
  // not see participant or vendor correspondence here.
  const actor = await getActingUser();
  if (!actor || actor.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <div className="card card-pad">
          <h1 className="text-lg font-semibold text-slate-900">
            Outbox is for admin staff
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This log holds correspondence for every enrollee. Switch to an admin
            user in the header to read it.
          </p>
        </div>
      </div>
    );
  }

  const rawKind = (await props.searchParams).kind;
  const kind = Array.isArray(rawKind) ? rawKind[0] : rawKind;

  const [emails, total] = await Promise.all([
    prisma.outboxEmail.findMany({
      where: kind ? { kind } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.outboxEmail.count(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <p className="section-title">Outbox</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        Every notification the portal generated
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        No SMTP server is configured and nothing leaves this machine — each message
        is written to the database and rendered here exactly as it would be sent.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip label={`All (${total})`} href="/outbox" active={!kind} />
        {Object.keys(KIND_LABELS).map((value) => (
          <FilterChip
            key={value}
            label={KIND_LABELS[value]}
            href={`/outbox?kind=${value}`}
            active={kind === value}
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {emails.map((email, index) => (
          <details
            key={email.id}
            open={index === 0}
            className="card group overflow-hidden"
          >
            <summary className="cursor-pointer list-none px-5 py-4 hover:bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                        KIND_STYLES[email.kind] ?? "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {KIND_LABELS[email.kind] ?? email.kind}
                    </span>
                    {email.enrollmentRef && (
                      <span className="font-mono text-[11px] text-slate-400">
                        {email.enrollmentRef}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900 break-words">
                    {email.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 break-words">
                    To: {email.to}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <time className="text-xs text-slate-500">
                    {formatDateTime(email.createdAt)}
                  </time>
                  <span className="text-xs font-semibold text-brand-600 group-open:hidden">
                    Read →
                  </span>
                  <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">
                    Close
                  </span>
                </div>
              </div>
            </summary>
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-slate-700">
                {email.body}
              </pre>
            </div>
          </details>
        ))}

        {emails.length === 0 && (
          <div className="card card-pad text-center">
            <p className="text-sm text-slate-600">
              No messages yet. Change a status from the{" "}
              <Link href="/admin" className="text-brand-600 underline">
                admin queue
              </Link>{" "}
              or send the daily digest to generate one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
        active
          ? "bg-slate-900 text-white ring-slate-900"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}
