import type { RequiredDocument } from "./types";

/**
 * Employee (caregiver) enrollment packet.
 *
 * Source: Continuum agent call notes, Desiree and Shavauna, 1–22 Sep 2026.
 * The two most common hold-ups are an I-9 the representative has not signed and
 * a missing relationship to the participant — both are called out in the hints.
 *
 * Completed packets go to enrollment@continuumfs.com (not to personal staff
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
    hint: "The representative signs as the employer. An unsigned I-9 is the other most common reason a packet is held.",
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
    hint: "Pay dates are the 15th and the last day of the month.",
    required: true,
  },
  {
    key: "cpr-first-aid",
    label: "CPR / First Aid Certification",
    required: true,
  },
  {
    key: "two-forms-of-id",
    label: "Two Forms of ID",
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
