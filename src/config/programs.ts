/** Georgia self-directed waiver programs served by Continuum Fiscal Services. */
export const PROGRAMS = ["COMP", "NOW", "CCSP", "SOURCE", "ICWP"] as const;

export type Program = (typeof PROGRAMS)[number];

export const PROGRAM_LABELS: Record<Program, string> = {
  COMP: "COMP — Comprehensive Supports Waiver",
  NOW: "NOW — New Options Waiver",
  CCSP: "CCSP — Community Care Services Program",
  SOURCE: "SOURCE — Service Options Using Resources in a Community Environment",
  ICWP: "ICWP — Independent Care Waiver Program",
};

export const ENROLLEE_TYPES = ["EMPLOYEE", "VENDOR", "PARTICIPANT"] as const;
export type EnrolleeType = (typeof ENROLLEE_TYPES)[number];

export const TYPE_LABELS: Record<EnrolleeType, string> = {
  EMPLOYEE: "Employee",
  VENDOR: "Vendor",
  PARTICIPANT: "Participant",
};

export const TYPE_BLURBS: Record<EnrolleeType, string> = {
  EMPLOYEE:
    "A caregiver, often a relative, hired to give hands-on care such as CLS, respite or CAI. The participant is the employer; Continuum runs payroll.",
  VENDOR:
    "An outside business or independent provider billing for a product or service — a day program, a supply company. Paid by invoice against its own EIN.",
  PARTICIPANT:
    "A waiver member self-directing their own services and budget, enrolling new or switching from another fiscal intermediary.",
};

/**
 * The employee-vs-vendor question agents ask on every caregiver call. Shown on
 * step 1 of the enrollment flow so the caller can answer it themselves.
 */
export const EMPLOYEE_VS_VENDOR: Array<{ aspect: string; employee: string; vendor: string }> = [
  {
    aspect: "Who employs them",
    employee: "The participant or representative. Continuum only runs payroll.",
    vendor: "Nobody — the vendor is an outside business.",
  },
  {
    aspect: "Paperwork",
    employee: "Full enrollment packet: I-9, W-4/G-4, background check release, direct deposit, CPR/First Aid, IDs, rate sheet.",
    vendor: "A W-9 carrying the vendor's own EIN.",
  },
  {
    aspect: "Background check",
    employee: "Yes — fingerprints through Checkpoint, then the Good to Go email.",
    vendor: "Not part of the process.",
  },
  {
    aspect: "How they are paid",
    employee: "Hourly through payroll on the 15th and the last day of the month, taxes withheld, W-2 issued.",
    vendor: "By invoice, signed off by the representative.",
  },
  {
    aspect: "EVV / Mobile Caregiver+",
    employee: "Yes, for CLS — clock in and out against a 30-day schedule.",
    vendor: "No.",
  },
];

export function typeLabel(type: string): string {
  return TYPE_LABELS[type as EnrolleeType] ?? type;
}
