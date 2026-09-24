import type { RequiredDocument } from "./types";

/**
 * Employee (caregiver) enrollment packet.
 *
 * Sources:
 *   - Continuum agent call notes, Desiree and Shavauna, 1–22 Sep 2026
 *   - Shavauna Clark, "INTEREST IN CONTINUUM", 26 Aug 2026 (the package actually
 *     sent to prospective reps, with the signing and copy rules)
 *
 * Continuum sends the whole packet as a single PDF ("2026 EMPLOYEE PACKET.pdf")
 * with a separate "employee samples.pdf" showing completed examples. The slots
 * below are the individual forms inside it, so an enrollee can return them
 * piecemeal.
 *
 * The two most common hold-ups are an I-9 the representative has not signed and
 * a missing relationship to the participant — both are called out in the hints.
 *
 * Completed packets go to enrollments@continuumfs.com (not to personal staff
 * addresses) and are processed first-in, first-out.
 */
export const EMPLOYEE_DOCUMENTS: RequiredDocument[] = [
  {
    key: "employee-information-form",
    label: "Employee Information Form",
    hint: "Must state the employee's relationship to the participant. Leaving it blank is one of the two most common reasons a packet is held.",
    required: true,
  },
  {
    key: "background-check-release",
    label: "Background Check Release",
    hint: "Authorises the Checkpoint criminal records check.",
    required: true,
  },
  {
    key: "direct-deposit",
    label: "Direct Deposit Form",
    required: true,
  },
  {
    key: "form-i9",
    label: "Form I-9, signed by the representative",
    hint: "Completed by the representative: the employee signs at the top, the representative at the bottom. An unsigned I-9 is the other most common reason a packet is held.",
    required: true,
  },
  {
    key: "form-w4",
    label: "Form W-4",
    hint: "Federal withholding election.",
    required: true,
  },
  {
    key: "form-g4",
    label: "Georgia Form G-4",
    hint: "State withholding election.",
    required: true,
  },
  {
    key: "payroll-schedule",
    label: "Payroll Schedule",
    hint: "Pay dates are the 15th and the last day of the month. Continuum also sends a pay schedule PDF as reference once the employer is set up — confirm whether a signed copy is collected back.",
    required: true,
    unconfirmed: true,
  },
  {
    key: "cpr-first-aid",
    label: "CPR / First Aid Certification",
    hint: "A copy of the certification must be submitted.",
    required: true,
  },
  {
    key: "two-forms-of-id",
    label: "Two Forms of ID — Driver's License and Social Security card",
    hint: "A copy of both must be submitted.",
    required: true,
  },
  {
    key: "rate-sheet",
    label: "Rate Sheet",
    hint: "Family hires: CLS $32.32/hr, CAI $36.74/hr, 40 hrs/week maximum, no overtime.",
    required: true,
  },
  {
    key: "tb-test-physical",
    label: "TB Test and Physical",
    hint: "ICWP only.",
    required: true,
    programs: ["ICWP"],
  },
];
