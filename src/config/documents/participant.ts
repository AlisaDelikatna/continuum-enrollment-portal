import type { RequiredDocument } from "./types";

/**
 * Participant enrollment packet (new, or switching from another FMS).
 *
 * Source: Continuum agent call notes, Desiree and Shavauna, 1–22 Sep 2026.
 *
 * About 97% of the packet is the participant's own information. The
 * representative completes only the fields labelled "representative" and signs
 * "in care of" the participant.
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
    hint: "The representative fills only the fields labelled 'representative' and signs in care of the participant.",
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
    label: "Self-Directed Training Certificate",
    hint: "Issued by DBHDD after roughly 4–5 hours of virtual training. A certificate from a previous year is not accepted — the representative must retake the training and complete the whole current packet.",
    required: true,
  },
  {
    key: "rd-1061",
    label: "RD 1061 with notarized page 2",
    hint: "Good-to-serve requirement.",
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
