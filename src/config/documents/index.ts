import type { EnrolleeType } from "../programs";
import { EMPLOYEE_DOCUMENTS } from "./employee";
import { PARTICIPANT_DOCUMENTS } from "./participant";
import type { RequiredDocument } from "./types";
import { VENDOR_DOCUMENTS } from "./vendor";

export type { RequiredDocument };

export const REQUIRED_DOCUMENTS: Record<EnrolleeType, RequiredDocument[]> = {
  EMPLOYEE: EMPLOYEE_DOCUMENTS,
  VENDOR: VENDOR_DOCUMENTS,
  PARTICIPANT: PARTICIPANT_DOCUMENTS,
};

/** The catch-all slot offered alongside the configured documents. */
export const OTHER_DOCUMENT: RequiredDocument = {
  key: "other",
  label: "Other supporting document",
  hint: "Anything not listed above.",
  required: false,
};

export function documentsFor(type: string): RequiredDocument[] {
  return REQUIRED_DOCUMENTS[type as EnrolleeType] ?? [];
}

export function documentLabel(type: string, key: string): string {
  if (key === OTHER_DOCUMENT.key) return OTHER_DOCUMENT.label;
  return documentsFor(type).find((d) => d.key === key)?.label ?? key;
}
