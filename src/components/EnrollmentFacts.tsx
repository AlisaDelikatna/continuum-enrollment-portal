import { PROGRAM_LABELS, typeLabel, type Program } from "@/config/programs";
import { formatDate, programCodes } from "@/lib/enrollments";

export type EnrollmentFactsInput = {
  refId: string;
  type: string;
  programs: { program: string }[];
  name: string;
  email: string;
  phone: string | null;
  participantName: string | null;
  relationship: string | null;
  businessName: string | null;
  contactName: string | null;
  repNameRaw: string | null;
  createdAt: Date;
  rep: { name: string; email: string } | null;
};

/** The "who is this" block shared by the enrollee, rep and admin detail views. */
export function EnrollmentFacts({ enrollment }: { enrollment: EnrollmentFactsInput }) {
  const facts: Array<[string, React.ReactNode]> = [
    ["Enrollment ID", <span key="refId" className="font-mono">{enrollment.refId}</span>],
    ["Enrollee type", typeLabel(enrollment.type)],
    [
      programCodes(enrollment).length === 1 ? "Program" : "Programs",
      <span key="programs" className="space-y-0.5 block">
        {programCodes(enrollment).map((code) => (
          <span key={code} className="block">
            {PROGRAM_LABELS[code as Program] ?? code}
          </span>
        ))}
        {programCodes(enrollment).length === 0 && <span>—</span>}
      </span>,
    ],
    ["Submitted", formatDate(enrollment.createdAt)],
    ["Name", enrollment.name],
    ["Email", enrollment.email],
    ["Phone", enrollment.phone ?? "—"],
  ];

  if (enrollment.type === "EMPLOYEE") {
    facts.push(["Works for participant", enrollment.participantName ?? "—"]);
    facts.push([
      "Relationship to participant",
      enrollment.relationship ?? (
        <span key="rel-missing" className="text-amber-700">
          Not provided — packets are held without it
        </span>
      ),
    ]);
    facts.push([
      "Assigned representative",
      enrollment.rep ? (
        <span key="rep">
          {enrollment.rep.name}{" "}
          <span className="text-slate-400">· {enrollment.rep.email}</span>
        </span>
      ) : enrollment.repNameRaw ? (
        <span key="rep-raw" className="text-amber-700">
          {enrollment.repNameRaw} — not yet linked
        </span>
      ) : (
        <span key="rep-none" className="text-slate-400">Unassigned</span>
      ),
    ]);
  }

  if (enrollment.type === "VENDOR") {
    facts.push(["Business name", enrollment.businessName ?? "—"]);
    facts.push(["Billing contact", enrollment.contactName ?? "—"]);
  }

  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
          <dd className="mt-1 text-sm text-slate-900 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
