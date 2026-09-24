"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { allDocumentsFor, documentLabel, OTHER_DOCUMENT } from "@/config/documents";
import { REQUIRE_COMPLETE_ENROLLMENT_FORM } from "@/config/demo";
import { ENROLLEE_TYPES, PROGRAMS, type EnrolleeType } from "@/config/programs";
import { isStatus, statusLabel } from "@/config/statuses";
import { prisma } from "./db";
import { sendDailyDigest, sendEnrollmentReceivedEmail, sendStatusChangeEmail } from "./email";
import { nextRefId } from "./enrollments";
import { ACTING_USER_COOKIE, getActingUser } from "./session";
import { saveUpload } from "./storage";

/* ---------------------------------------------------------------- */
/* Role switcher                                                     */
/* ---------------------------------------------------------------- */

export async function setActingUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const store = await cookies();
  if (id) {
    store.set(ACTING_USER_COOKIE, id, { path: "/", httpOnly: false, sameSite: "lax" });
  } else {
    store.delete(ACTING_USER_COOKIE);
  }
  revalidatePath("/", "layout");
}

/* ---------------------------------------------------------------- */
/* Enrollment                                                        */
/* ---------------------------------------------------------------- */

export type EnrollmentInput = {
  type: string;
  /** One or more waiver programs; at least one is required. */
  programs: string[];
  name: string;
  email: string;
  phone?: string;
  participantName?: string;
  relationship?: string;
  repName?: string;
  repEmail?: string;
  businessName?: string;
  contactName?: string;
};

export type CreatedEnrollment = {
  id: string;
  refId: string;
  status: string;
  type: string;
  /** Program codes, so step 3 can ask for the right waiver-specific documents. */
  programs: string[];
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function createEnrollment(input: EnrollmentInput): Promise<CreatedEnrollment> {
  const type = input.type as EnrolleeType;
  if (!ENROLLEE_TYPES.includes(type)) throw new Error("Unknown enrollee type.");

  const programs = Array.from(new Set(input.programs ?? [])).filter((program) =>
    (PROGRAMS as readonly string[]).includes(program),
  );

  // refId is needed up front so a blank email can be backfilled from it.
  const refId = await nextRefId(type);

  let name = input.name.trim();
  let email = input.email.trim().toLowerCase();

  if (REQUIRE_COMPLETE_ENROLLMENT_FORM) {
    if (programs.length === 0) throw new Error("Pick at least one waiver program.");
    if (!name) throw new Error("Name is required.");
    if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
  } else {
    // Demo mode: never block the walkthrough. Blanks become obvious
    // placeholders rather than errors, and an enrollment may carry no program.
    if (!name) name = `Unnamed enrollee (${refId})`;
    if (!EMAIL_RE.test(email)) email = `${refId.toLowerCase()}@placeholder.invalid`;
  }

  // Reuse the User row if this email already exists so the role switcher and
  // /me stay coherent; otherwise create the enrollee identity.
  const enrollee = await prisma.user.upsert({
    where: { email },
    update: { name, phone: input.phone?.trim() || undefined },
    create: { name, email, phone: input.phone?.trim() || null, role: "ENROLLEE" },
  });

  // If the form named a rep we already know, link them straight away.
  const repEmail = input.repEmail?.trim().toLowerCase() || null;
  const existingRep = repEmail
    ? await prisma.user.findFirst({ where: { email: repEmail, role: "REP" }, select: { id: true } })
    : null;

  const enrollment = await prisma.enrollment.create({
    data: {
      refId,
      type,
      programs: { create: programs.map((program) => ({ program })) },
      status: "RECEIVED",
      name,
      email,
      phone: input.phone?.trim() || null,
      participantName: type === "EMPLOYEE" ? input.participantName?.trim() || null : null,
      relationship: type === "EMPLOYEE" ? input.relationship?.trim() || null : null,
      repNameRaw: type === "EMPLOYEE" ? input.repName?.trim() || null : null,
      repEmailRaw: type === "EMPLOYEE" ? repEmail : null,
      businessName: type === "VENDOR" ? input.businessName?.trim() || null : null,
      contactName: type === "VENDOR" ? input.contactName?.trim() || null : null,
      enrolleeId: enrollee.id,
      repId: type === "EMPLOYEE" ? existingRep?.id ?? null : null,
      statusEvents: {
        create: {
          status: "RECEIVED",
          note: "Enrollment submitted through the public portal.",
          changedById: enrollee.id,
        },
      },
    },
    select: { id: true, refId: true, status: true, type: true },
  });

  await sendEnrollmentReceivedEmail(enrollment.id);

  // Sign the new enrollee in so they land on their own status page.
  const store = await cookies();
  store.set(ACTING_USER_COOKIE, enrollee.id, { path: "/", httpOnly: false, sameSite: "lax" });

  revalidatePath("/", "layout");
  return { ...enrollment, programs };
}

/* ---------------------------------------------------------------- */
/* Documents                                                         */
/* ---------------------------------------------------------------- */

async function canUploadFor(enrollmentId: string) {
  const [actor, enrollment] = await Promise.all([
    getActingUser(),
    prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, type: true, enrolleeId: true, repId: true },
    }),
  ]);
  if (!enrollment) throw new Error("Enrollment not found.");
  if (!actor) return { actor: null, enrollment };

  if (actor.role === "ADMIN") return { actor, enrollment };
  if (actor.role === "REP") {
    if (enrollment.type !== "EMPLOYEE" || enrollment.repId !== actor.id) {
      throw new Error("Reps can only upload for their own employees.");
    }
    return { actor, enrollment };
  }
  if (enrollment.enrolleeId !== actor.id) {
    throw new Error("You can only upload documents to your own enrollment.");
  }
  return { actor, enrollment };
}

/**
 * Handles both shapes of upload form:
 *   - the enrollment wizard, which posts one input per slot named `file:<docKey>`
 *   - the single-slot forms on /me, /rep and /admin, which post `docKey` + `file`
 * No email is sent here by design — uploads roll into the daily admin digest.
 */
export async function uploadDocuments(
  formData: FormData,
): Promise<{ ok: boolean; message: string; uploaded: number }> {
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  let actor: Awaited<ReturnType<typeof canUploadFor>>["actor"];
  let enrollment: Awaited<ReturnType<typeof canUploadFor>>["enrollment"];
  try {
    ({ actor, enrollment } = await canUploadFor(enrollmentId));
  } catch (error) {
    return {
      ok: false,
      uploaded: 0,
      message: error instanceof Error ? error.message : "Upload failed.",
    };
  }

  const pairs: Array<{ docKey: string; file: File }> = [];

  const single = formData.get("file");
  if (single instanceof File && single.size > 0) {
    pairs.push({ docKey: String(formData.get("docKey") ?? OTHER_DOCUMENT.key), file: single });
  }
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("file:")) continue;
    if (value instanceof File && value.size > 0) {
      pairs.push({ docKey: key.slice("file:".length), file: value });
    }
  }

  if (pairs.length === 0) {
    return { ok: false, uploaded: 0, message: "Choose at least one file first." };
  }

  const known = new Set([
    ...allDocumentsFor(enrollment.type).map((d) => d.key),
    OTHER_DOCUMENT.key,
  ]);

  for (const { docKey, file } of pairs) {
    const key = known.has(docKey) ? docKey : OTHER_DOCUMENT.key;
    const saved = await saveUpload(file);
    await prisma.document.create({
      data: {
        enrollmentId: enrollment.id,
        docKey: key,
        label: documentLabel(enrollment.type, key),
        originalName: saved.originalName,
        storedName: saved.storedName,
        mimeType: saved.mimeType,
        size: saved.size,
        uploadedById: actor?.id ?? enrollment.enrolleeId ?? null,
      },
    });
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    uploaded: pairs.length,
    message: `${pairs.length} document${pairs.length === 1 ? "" : "s"} uploaded. Admin staff will see ${
      pairs.length === 1 ? "it" : "them"
    } on today's digest.`,
  };
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("documentId") ?? "");
  const actor = await getActingUser();
  if (actor?.role !== "ADMIN") throw new Error("Only admin staff can remove documents.");
  await prisma.document.delete({ where: { id } });
  revalidatePath("/", "layout");
}

/* ---------------------------------------------------------------- */
/* Admin: status + rep assignment + digest                           */
/* ---------------------------------------------------------------- */

async function requireAdmin() {
  const actor = await getActingUser();
  if (!actor || actor.role !== "ADMIN") {
    throw new Error("Switch to an admin user to perform this action.");
  }
  return actor;
}

export type ActionState = { ok: boolean; message: string } | null;

export async function changeStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireAdmin();
    const enrollmentId = String(formData.get("enrollmentId") ?? "");
    const status = String(formData.get("status") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    if (!isStatus(status)) return { ok: false, message: "Pick a valid status." };
    if (status === "MISSING_INFO" && !note) {
      return {
        ok: false,
        message: "Missing info requires a note describing exactly what is outstanding.",
      };
    }

    await prisma.$transaction([
      prisma.enrollment.update({ where: { id: enrollmentId }, data: { status } }),
      prisma.statusEvent.create({
        data: { enrollmentId, status, note: note || null, changedById: actor.id },
      }),
    ]);

    const email = await sendStatusChangeEmail({
      enrollmentId,
      status,
      note,
      changedByName: actor.name,
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Status set to ${statusLabel(status)}. ${
        email ? `Notification queued to ${email.to}.` : "No recipients on file."
      }`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function assignRep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const enrollmentId = String(formData.get("enrollmentId") ?? "");
    const repId = String(formData.get("repId") ?? "");

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { type: true },
    });
    if (enrollment?.type !== "EMPLOYEE") {
      return { ok: false, message: "Only employees have an assigned rep." };
    }

    const rep = repId
      ? await prisma.user.findFirst({ where: { id: repId, role: "REP" }, select: { id: true, name: true } })
      : null;
    if (repId && !rep) return { ok: false, message: "That rep no longer exists." };

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { repId: rep?.id ?? null },
    });

    revalidatePath("/", "layout");
    return { ok: true, message: rep ? `Rep set to ${rep.name}.` : "Rep unassigned." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function sendDigest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const raw = String(formData.get("date") ?? "");
    // `raw` is a yyyy-mm-dd value from <input type="date">; parse as local time.
    const date = raw ? new Date(`${raw}T12:00:00`) : new Date();
    if (Number.isNaN(date.getTime())) return { ok: false, message: "Pick a valid date." };

    const { digest } = await sendDailyDigest(date);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Digest for ${digest.date.toLocaleDateString("en-US")} sent to ${
        digest.to.join(", ") || "no admin recipients"
      } — ${digest.rows.length} upload${digest.rows.length === 1 ? "" : "s"} listed. Open /outbox to read it.`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Something went wrong." };
  }
}
