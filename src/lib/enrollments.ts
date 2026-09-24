import { documentsFor } from "../config/documents";
import { PROGRAMS, type EnrolleeType } from "../config/programs";
import { prisma } from "./db";

const TYPE_PREFIX: Record<EnrolleeType, string> = {
  EMPLOYEE: "EMP",
  VENDOR: "VEN",
  PARTICIPANT: "PAR",
};

/** CFS-EMP-0042 — sequential per type, with a retry in case of a race. */
export async function nextRefId(type: string) {
  const prefix = TYPE_PREFIX[type as EnrolleeType] ?? "ENR";
  for (let attempt = 0; attempt < 25; attempt++) {
    const count = await prisma.enrollment.count({ where: { type } });
    const candidate = `CFS-${prefix}-${String(count + 1 + attempt).padStart(4, "0")}`;
    const taken = await prisma.enrollment.findUnique({
      where: { refId: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `CFS-${prefix}-${Date.now().toString().slice(-6)}`;
}

/**
 * How many of the *required* slots for this enrollment have at least one upload.
 * `programs` matters: program-specific requirements (the ICWP TB test, say)
 * only count for enrollments under that waiver.
 */
export function documentProgress(type: string, docKeys: string[], programs: string[] = []) {
  const required = documentsFor(type, programs).filter((d) => d.required);
  const present = new Set(docKeys);
  const complete = required.filter((d) => present.has(d.key)).length;
  return { complete, total: required.length };
}

export function missingDocuments(type: string, docKeys: string[], programs: string[] = []) {
  const present = new Set(docKeys);
  return documentsFor(type, programs).filter((d) => d.required && !present.has(d.key));
}

/** The note attached to the most recent MISSING_INFO event, if that's the current status. */
export async function currentMissingInfoNote(enrollmentId: string, status: string) {
  if (status !== "MISSING_INFO") return null;
  const event = await prisma.statusEvent.findFirst({
    where: { enrollmentId, status: "MISSING_INFO" },
    orderBy: { createdAt: "desc" },
    select: { note: true, createdAt: true, changedBy: { select: { name: true } } },
  });
  return event?.note ? event : null;
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Waiver programs (an enrollment can carry more than one)             */
/* ------------------------------------------------------------------ */

export type WithPrograms = { programs: { program: string }[] };

/** Program codes in the canonical config order, not insertion order. */
export function programCodes(enrollment: WithPrograms): string[] {
  const order = PROGRAMS as readonly string[];
  return enrollment.programs
    .map((p) => p.program)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function programList(enrollment: WithPrograms): string {
  const codes = programCodes(enrollment);
  return codes.length > 0 ? codes.join(", ") : "—";
}
