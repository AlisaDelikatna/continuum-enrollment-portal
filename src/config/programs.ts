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
    "A support worker hired directly by a waiver participant or their representative.",
  VENDOR:
    "A business or agency providing goods and services billed through the waiver.",
  PARTICIPANT:
    "A waiver member self-directing their own services and budget.",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type as EnrolleeType] ?? type;
}
