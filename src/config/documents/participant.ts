import type { RequiredDocument } from "./types";

/**
 * Participant enrollment packet (new, or switching from another FMS).
 *
 * Sources:
 *   - Continuum agent call notes, Desiree and Shavauna, 1–22 Sep 2026
 *   - Shavauna Clark, "INTEREST IN CONTINUUM", 26 Aug 2026 (the package actually
 *     sent to prospective reps)
 *
 * The Participant Enrollment Package is ONE PDF ("2025 participant packet.pdf")
 * bundling all of the forms below, sent alongside a separate
 * "SAMPLE FORMS (PARTICIPANT).pdf" of completed examples. The slots below break
 * that bundle into its individual forms so an enrollee can return them piecemeal.
 *
 * About 97% of the packet is the participant's own information. The
 * representative completes only the fields labelled "representative". Where the
 * participant cannot sign, the representative signs their own name in care of
 * the participant ("Jane Doe in care of John Doe") on all forms.
 *
 * Deliberately NOT collected:
 *   - the general Power of Attorney — discarded; only the Limited POA is used
 *   - the Cost Share Payment Agreement — COMP has no cost share
 *   - the EIN application and Department of Labor registration — Continuum files both
 *   - an active PA/budget in GAMMIS — a system check, not an upload. Never promise
 *     a start date until the PA is visible in GAMMIS; Continuum cannot load one
 *     from an email.
 */
export const PARTICIPANT_DOCUMENTS: RequiredDocument[] = [
  {
    key: "participant-packet",
    label: "Participant Packet",
    hint: "Sent as a single PDF containing every form below. The representative fills only the fields labelled 'representative' and, where the participant cannot sign, signs their own name in care of the participant.",
    required: true,
  },
  {
    key: "limited-poa",
    label: "Limited Power of Attorney — notarized",
    hint: "Must be notarized. The general POA in the packet is not used.",
    required: true,
  },
  {
    key: "form-ss4",
    label: "IRS Form SS-4",
    hint: "Participant's name on lines 1 and 7a; HHCSR on lines 9a and 17. Third Party Designee is Continuum Fiscal Services, 260 Peachtree St NW, Suite 1903, Atlanta, GA 30303.",
    required: true,
  },
  {
    key: "form-2678",
    label: "IRS Form 2678",
    hint: "Participant as employer, Continuum as designee.",
    required: true,
    unconfirmed: true,
  },
  {
    key: "form-8821",
    label: "IRS Form 8821",
    hint: "Participant as employer, Continuum as designee.",
    required: true,
    unconfirmed: true,
  },
  {
    key: "training-certificate",
    label: "Self-Directed Training Certificate (representative)",
    hint: "The representative's certificate, sent with the paperwork. Issued by DBHDD after roughly 4–5 hours of virtual training. A certificate from a previous year is not accepted — the representative must retake the training and complete the whole current packet.",
    required: true,
  },
  {
    key: "rd-1061",
    label: "Form RD-1061 — notarized",
    hint: "Good-to-serve requirement. Must be notarized; the call notes specify page 2 in particular.",
    required: true,
  },
  {
    key: "icd-10",
    label: "ICD-10 Diagnosis Code",
    hint: "Good-to-serve requirement. If the code is unknown, get it from the support coordinator.",
    required: true,
  },
  {
    key: "family-hire-request",
    label: "Family Hire Request",
    hint: "Only if a relative will be paid as a caregiver. DBHDD is the sole approver — the representative emails it to participant.direction@dbhdd.ga.gov and forwards the approval on. Every relative needs their own approval, renewed yearly.",
    required: false,
  },
];
