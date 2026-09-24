import type { RequiredDocument } from "./types";

/**
 * Employee (caregiver) enrollment packet.
 *
 * PRIMARY SOURCE: the "Fiscal Employer Agent Employee Enrollment Checklist" on
 * page 2 of `2026 EMPLOYEE PACKET.pdf`, attached to Shavauna Clark's "INTEREST
 * IN CONTINUUM", 26 Aug 2026. (The packet is 17 scanned pages; the checklist
 * was read by OCR.) Where the agent call notes (1–22 Sep 2026) disagree, the
 * checklist wins and the conflict is noted below.
 *
 * The packet is ONE PDF bundling every form. Each form inside it gets its own
 * slot here, so an enrollee can return them piecemeal and staff can see exactly
 * which form is outstanding instead of one all-or-nothing "packet received".
 *
 * Forms physically in the packet, in order: Employee Information Form (p3),
 * Employee Release of Background Information (p4), Authorization for Reference
 * from Prior Employer (p5), Direct Deposit Authorization (p6), Form I-9 with
 * the Lists of Acceptable Documents (p7–8), Form W-4 (p9–13), Georgia Form G-4
 * (p14–15), Employee Rate Form (p16), 2025 Payment Schedule (p17).
 *
 * NOT collected — the checklist marks it "Supplemental Form (keep for future
 * use)": the Payroll Schedule. Continuum sends it out; it does not come back.
 *
 * Completed packets go to enrollments@continuumfs.com (not to personal staff
 * addresses) and are processed first-in, first-out.
 */
export const EMPLOYEE_DOCUMENTS: RequiredDocument[] = [
  // --- Submit to your employer ------------------------------------------
  {
    key: "employee-information-form",
    label: "Employee Information Form",
    hint: "Must state the employee's relationship to the participant. Leaving it blank is one of the two most common reasons a packet is held.",
    required: true,
  },
  {
    key: "background-release",
    label: "Background Release",
    hint: "Covers both pages in the packet: the Employee Release of Background Information and the Authorization for Reference from a Prior Employer. Authorises the Checkpoint criminal records check.",
    required: true,
  },
  {
    key: "direct-deposit",
    label: "Direct Deposit Authorization",
    hint: "Attach a voided check or a letter from the financial institution. Paper checks are issued for the first one to two pay periods regardless.",
    required: true,
  },
  {
    key: "tb-test",
    label: "TB Test",
    hint: "On the packet checklist for every employee, though the agent call notes describe the TB test and physical as ICWP-only — confirm which applies.",
    required: true,
    unconfirmed: true,
  },
  {
    key: "physical-exam",
    label: "Physical Exam",
    hint: "For ICWP it must be within the past 12 months. On the packet checklist for every employee, though the call notes describe it as ICWP-only — confirm which applies.",
    required: true,
    unconfirmed: true,
  },
  {
    key: "cpr-first-aid",
    label: "CPR / First Aid Certification",
    hint: "A copy of the certification must be submitted.",
    required: true,
  },

  // --- Employee tax forms ------------------------------------------------
  {
    key: "form-i9",
    label: "Form I-9 — Employment Eligibility Verification",
    hint: "Completed by the representative: the employee signs at the top, the representative at the bottom. An unsigned I-9 is the other most common reason a packet is held.",
    required: true,
  },
  {
    key: "drivers-license",
    label: "Driver's License",
    hint: "A copy. One of the two required I-9 attachments.",
    required: true,
  },
  {
    key: "social-security-card",
    label: "Social Security Card",
    hint: "A copy. The other required I-9 attachment.",
    required: true,
  },
  {
    key: "form-w4",
    label: "Form W-4 — Employee's Withholding Certificate",
    hint: "Federal withholding election.",
    required: true,
  },
  {
    key: "form-g4",
    label: "Georgia Form G-4 — State Withholding Allowance Certificate",
    hint: "State withholding election.",
    required: true,
  },

  // --- Completed by the employer, not the employee -----------------------
  {
    key: "rate-sheet",
    label: "Employee Rate Form",
    hint: "One per employee, filled in and signed by the participant or representative rather than the employee. Must arrive a week before the pay period end date; retroactive rate changes are not allowed, and a new form is needed for every wage change.",
    required: true,
  },
];
