import type { RequiredDocument } from "./types";

/**
 * PLACEHOLDER LIST — edit freely.
 * Required documents for an Employee enrollment packet.
 * `key` is stored on the Document row, so renaming a `label` is safe but
 * changing a `key` orphans documents already uploaded against the old key.
 */
export const EMPLOYEE_DOCUMENTS: RequiredDocument[] = [
  {
    key: "employment-application",
    label: "Employment Application",
    hint: "Placeholder — swap for the current CFS application packet.",
    required: true,
  },
  {
    key: "form-w4",
    label: "Form W-4 (Employee's Withholding Certificate)",
    hint: "Placeholder — federal withholding election.",
    required: true,
  },
  {
    key: "form-g4",
    label: "Georgia Form G-4 (State Withholding)",
    hint: "Placeholder — state withholding election.",
    required: true,
  },
  {
    key: "form-i9",
    label: "Form I-9 with Supporting ID",
    hint: "Placeholder — identity and work authorization.",
    required: true,
  },
  {
    key: "background-check-consent",
    label: "Background Check Consent",
    hint: "Placeholder — criminal records check authorization.",
    required: true,
  },
  {
    key: "direct-deposit",
    label: "Direct Deposit Authorization",
    hint: "Placeholder — optional; paper check issued if omitted.",
    required: false,
  },
];
