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

/** Every configured document for a type, including program-specific ones. */
export function allDocumentsFor(type: string): RequiredDocument[] {
  return REQUIRED_DOCUMENTS[type as EnrolleeType] ?? [];
}

/**
 * The documents this particular enrollment needs.
 *
 * Some requirements only apply to certain waivers — the TB test and physical is
 * ICWP-only, for instance — so pass the enrollment's program codes. With no
 * programs supplied, program-specific documents are left out rather than asked
 * for speculatively.
 */
export function documentsFor(type: string, programs: string[] = []): RequiredDocument[] {
  return allDocumentsFor(type).filter(
    (doc) => !doc.programs || doc.programs.some((program) => programs.includes(program)),
  );
}

export function documentLabel(type: string, key: string): string {
  if (key === OTHER_DOCUMENT.key) return OTHER_DOCUMENT.label;
  // Looked up against the full list: a document can be filed under a
  // program-specific slot and still need a label later.
  return allDocumentsFor(type).find((d) => d.key === key)?.label ?? key;
}
