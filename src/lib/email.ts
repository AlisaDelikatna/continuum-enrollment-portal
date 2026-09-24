import { statusLabel } from "../config/statuses";
import { typeLabel } from "../config/programs";
import { KIND_LABELS, packetFor } from "../config/packets";
import { prisma } from "./db";
import { programList } from "./enrollments";

/**
 * Nothing here talks to an SMTP server. Every message is written to the
 * OutboxEmail table and rendered at /outbox so it can be shown live.
 */

// Confirmed against the Continuum signature block in two of Shavauna Clark's
// emails (30 Jul and 26 Aug 2026): the enrollment inbox is PLURAL.
const ENROLLMENT_INBOX = "enrollments@continuumfs.com";
const PHONE = "678-974-7942";

// PLACEHOLDER — the real portal URL was never given in the source notes.
const PORTAL_URL = "https://portal.continuumfs.com";

type QueueArgs = {
  to: string[];
  subject: string;
  body: string;
  kind: "STATUS_CHANGE" | "UPLOAD_DIGEST" | "ENROLLMENT_RECEIVED";
  enrollmentRef?: string | null;
};

async function queue({ to, subject, body, kind, enrollmentRef }: QueueArgs) {
  const recipients = to.filter(Boolean);
  if (recipients.length === 0) return null;
  return prisma.outboxEmail.create({
    data: {
      to: recipients.join(", "),
      subject,
      body,
      kind,
      enrollmentRef: enrollmentRef ?? null,
    },
  });
}

function signature() {
  return [
    "",
    "— Continuum Fiscal Services",
    `Enrollment Team · ${PHONE} · ${ENROLLMENT_INBOX}`,
    "260 Peachtree St NW, Suite 1903, Atlanta, GA 30303",
    "(Demo environment — no real email was sent)",
  ].join("\n");
}

type EnrollmentForEmail = {
  id: string;
  refId: string;
  type: string;
  name: string;
  email: string;
  programs: { program: string }[];
  repEmailRaw: string | null;
  rep: { name: string; email: string } | null;
};

async function loadEnrollment(enrollmentId: string) {
  return prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      refId: true,
      type: true,
      name: true,
      email: true,
      type: true,
      programs: { select: { program: true } },
      repEmailRaw: true,
      rep: { select: { name: true, email: true } },
    },
  });
}

/**
 * Who hears about a status change:
 *   EMPLOYEE  -> the employee AND their assigned rep
 *   VENDOR    -> the vendor
 *   PARTICIPANT -> the participant
 * If an employee has no assigned rep yet, we fall back to the rep email typed
 * on the enrollment form so the notification still lands somewhere.
 */
export function statusRecipients(enrollment: EnrollmentForEmail): string[] {
  if (enrollment.type !== "EMPLOYEE") return [enrollment.email];
  const repEmail = enrollment.rep?.email ?? enrollment.repEmailRaw ?? null;
  return repEmail ? [enrollment.email, repEmail] : [enrollment.email];
}

export async function sendStatusChangeEmail(opts: {
  enrollmentId: string;
  status: string;
  note?: string | null;
  changedByName?: string | null;
}) {
  const enrollment = await loadEnrollment(opts.enrollmentId);
  if (!enrollment) return null;

  const label = statusLabel(opts.status);
  const lines = [
    `Hello ${enrollment.name},`,
    "",
    `The status of enrollment ${enrollment.refId} (${typeLabel(
      enrollment.type,
    )} · ${programList(enrollment)}) is now: ${label}.`,
  ];

  if (opts.status === "MISSING_INFO") {
    lines.push(
      "",
      "WHAT WE STILL NEED:",
      opts.note?.trim() || "See your status page for details.",
      "",
      "Your enrollment stays on hold until these items are received.",
    );
  } else if (opts.note?.trim()) {
    lines.push("", `Note from our team: ${opts.note.trim()}`);
  }

  if (enrollment.type === "EMPLOYEE") {
    const repName = enrollment.rep?.name ?? enrollment.repEmailRaw;
    if (repName) lines.push("", `Your representative ${repName} was copied on this message.`);
  }

  lines.push("", `View status: ${PORTAL_URL}/me`, ...(opts.changedByName ? [`Updated by: ${opts.changedByName}`] : []), signature());

  return queue({
    to: statusRecipients(enrollment),
    subject: `[${enrollment.refId}] Enrollment status: ${label}`,
    body: lines.join("\n"),
    kind: "STATUS_CHANGE",
    enrollmentRef: enrollment.refId,
  });
}

export async function sendEnrollmentReceivedEmail(enrollmentId: string) {
  const enrollment = await loadEnrollment(enrollmentId);
  if (!enrollment) return null;

  const body = [
    `Hello ${enrollment.name},`,
    "",
    `We received your ${typeLabel(enrollment.type).toLowerCase()} enrollment for the following waiver program(s): ${programList(
      enrollment,
    )}.`,
    "",
    `Enrollment ID: ${enrollment.refId}`,
    `Current status: ${statusLabel("RECEIVED")}`,
    "",
    "Packets are reviewed first-in, first-out — allow 24–48 business hours, longer during payroll week. You can upload any remaining documents at any time from your status page.",
    ...packetLines(enrollment.type),
    "",
    `Status page: ${PORTAL_URL}/me`,
    signature(),
  ].join("\n");

  return queue({
    to: statusRecipients(enrollment),
    subject: `[${enrollment.refId}] We received your enrollment`,
    body,
    kind: "ENROLLMENT_RECEIVED",
    enrollmentRef: enrollment.refId,
  });
}

/**
 * The blank forms to print and fill, listed in the confirmation email. This is
 * the "INTEREST IN CONTINUUM" package — not the good-to-serve welcome package,
 * which only goes out once the enrollment is approved.
 */
function packetLines(type: string): string[] {
  const forms = packetFor(type);
  if (forms.length === 0) return [];
  return [
    "",
    "YOUR FORMS — print, complete and upload:",
    ...forms.flatMap((form) => [
      "",
      `• ${form.label} — ${KIND_LABELS[form.kind]}`,
      `    ${PORTAL_URL}${form.file}`,
    ]),
  ];
}

/* ------------------------------------------------------------------ */
/* Daily upload digest                                                 */
/* ------------------------------------------------------------------ */

export function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export type DigestRow = {
  enrollee: string;
  refId: string;
  type: string;
  document: string;
  fileName: string;
  uploadedBy: string;
  at: Date;
};

export type Digest = {
  date: Date;
  rows: DigestRow[];
  to: string[];
  subject: string;
  body: string;
};

/**
 * Builds — but does not send — the admin digest for a single calendar day.
 * Exported on its own so a future cron job can reuse it.
 */
export async function buildDailyDigest(date: Date): Promise<Digest> {
  const { start, end } = dayBounds(date);

  const [docs, admins] = await Promise.all([
    prisma.document.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
      select: {
        label: true,
        originalName: true,
        createdAt: true,
        uploadedBy: { select: { name: true, role: true } },
        enrollment: { select: { name: true, refId: true, type: true } },
      },
    }),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
  ]);

  const rows: DigestRow[] = docs.map((d) => ({
    enrollee: d.enrollment.name,
    refId: d.enrollment.refId,
    type: typeLabel(d.enrollment.type),
    document: d.label,
    fileName: d.originalName,
    uploadedBy: d.uploadedBy
      ? `${d.uploadedBy.name} (${d.uploadedBy.role.toLowerCase()})`
      : "Unknown",
    at: d.createdAt,
  }));

  const dateLabel = start.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bodyLines = [
    `Daily document upload digest — ${dateLabel}`,
    "",
    rows.length === 0
      ? "No documents were uploaded on this date."
      : `${rows.length} document${rows.length === 1 ? "" : "s"} uploaded:`,
  ];

  for (const row of rows) {
    bodyLines.push(
      "",
      `• ${row.enrollee} (${row.refId} · ${row.type})`,
      `    Document:    ${row.document}`,
      `    File:        ${row.fileName}`,
      `    Uploaded by: ${row.uploadedBy}`,
      `    Time:        ${row.at.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`,
    );
  }

  bodyLines.push("", `Review queue: ${PORTAL_URL}/admin`, signature());

  return {
    date: start,
    rows,
    to: admins.map((a) => a.email),
    subject: `Daily upload digest — ${start.toLocaleDateString("en-US")} (${rows.length} upload${
      rows.length === 1 ? "" : "s"
    })`,
    body: bodyLines.join("\n"),
  };
}

/** Builds the digest for `date` and drops it in the outbox. */
export async function sendDailyDigest(date: Date) {
  const digest = await buildDailyDigest(date);
  const email = await queue({
    to: digest.to,
    subject: digest.subject,
    body: digest.body,
    kind: "UPLOAD_DIGEST",
  });
  return { digest, email };
}
