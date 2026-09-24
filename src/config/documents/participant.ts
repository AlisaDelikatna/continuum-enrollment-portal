import type { RequiredDocument } from "./types";

/**
 * Participant enrollment packet.
 *
 * PRIMARY SOURCE: the "Fiscal Employer Agent Participant Enrollment Checklist"
 * on page 4 of `2025 participant packet.pdf` (Participant Enrollment Packet,
 * revised January 2025), attached to Shavauna Clark's "INTEREST IN CONTINUUM",
 * 26 Aug 2026. Where the agent call notes (1–22 Sep 2026) disagree with that
 * checklist, the checklist wins and the conflict is noted below.
 *
 * The packet is ONE 25-page PDF bundling every form. The slots below break it
 * into the individual forms the checklist asks to be submitted, so an enrollee
 * can return them piecemeal and staff can see precisely what is outstanding.
 *
 * Where the participant cannot sign, the representative signs their own name in
 * care of the participant ("Jane Doe in care of John Doe") on all forms.
 *
 * NOT collected — the checklist marks these "Supplemental Forms (keep for future
 * use)", so they are reference material sent to the employer, not intake:
 *   Payroll Calendar · Online Time Sheet Instructions · Information Update Form
 *   · Rate Sheet · Termination Form · Separation Notice · What It Costs You
 *
 * Also not collected: an active PA/budget in GAMMIS is a system check, not an
 * upload. Never promise a start date until the PA is visible in GAMMIS —
 * Continuum cannot load one from an email.
 */
export const PARTICIPANT_DOCUMENTS: RequiredDocument[] = [
  // --- Participant Enrollment Packet -----------------------------------
  {
    key: "participant-rep-information-form",
    label: "Participant and Representative Information Form",
    required: true,
  },
  {
    key: "participant-agreement",
    label: "Participant Agreement and Acknowledgement Form",
    hint: "Names the waiver program: COMP, NOW, CCSP, ICWP or SOURCE.",
    required: true,
  },
  {
    key: "release-of-information",
    label: "Authorization for Release of Information",
    required: true,
  },
  {
    key: "power-of-attorney",
    label: "Power of Attorney",
    hint: "The general POA. The agent call notes said this one could be discarded, but the packet checklist lists it as a submitted form — confirm which is current.",
    required: true,
    unconfirmed: true,
  },
  {
    key: "limited-poa",
    label: "Limited Power of Attorney — notarized",
    hint: "Must be notarized.",
    required: true,
  },
  {
    key: "ccsp-cost-share",
    label: "CCSP Cost Share Payment Agreement",
    hint: "CCSP waivers only. COMP has no cost share, so it is discarded on a COMP packet.",
    required: true,
    programs: ["CCSP"],
  },

  // --- Participant Tax Forms -------------------------------------------
  {
    key: "form-ss4",
    label: "IRS Form SS-4 — Application for Employer Identification Number",
    hint: "Continuum applies for the EIN. Participant's name on lines 1 and 7a; HHCSR on lines 9a and 17. Third Party Designee is Continuum Fiscal Services, 260 Peachtree St NW, Suite 1903, Atlanta, GA 30303.",
    required: true,
  },
  {
    key: "form-2678",
    label: "IRS Form 2678 — Employer/Payer Appointment of Agent",
    hint: "Participant as employer, Continuum as designee.",
    required: true,
  },
  {
    key: "form-8821",
    label: "IRS Form 8821 — Tax Information Authorization",
    required: true,
  },
  {
    key: "dol-employer-status-report",
    label: "Employer Status Report — Georgia Dept. of Labor",
    hint: "On the packet checklist as a submitted tax form, though the agent call notes say Continuum handles the Department of Labor registration itself — confirm who completes it.",
    required: true,
    unconfirmed: true,
  },
  {
    key: "rd-1061",
    label: "Form RD-1061 — Power of Attorney and Declaration, Georgia Dept. of Revenue",
    hint: "Must be notarized; the call notes single out page 2.",
    required: true,
  },

  // --- Good-to-serve items, sent alongside the packet -------------------
  // These are not on the packet checklist; they come from the agent call notes
  // as the remaining "good to serve" requirements.
  {
    key: "training-certificate",
    label: "Self-Directed Training Certificate (representative)",
    hint: "The representative's certificate, sent with the paperwork. Issued by DBHDD after roughly 4–5 hours of virtual training. A certificate from a previous year is not accepted — the representative must retake the training and complete the whole current packet.",
    required: true,
  },
  {
    key: "icd-10",
    label: "ICD-10 Diagnosis Code",
    hint: "Good-to-serve requirement. If the code is unknown, get it from the support coordinator.",
    required: true,
  },

  // --- Optional ---------------------------------------------------------
  {
    key: "family-hire-request",
    label: "Family Hire Request",
    hint: "Only if a relative will be paid as a caregiver. DBHDD is the sole approver — the representative emails it to participant.direction@dbhdd.ga.gov and forwards the approval on. Every relative needs their own approval, renewed yearly.",
    required: false,
  },
];
