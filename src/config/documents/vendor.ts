import type { RequiredDocument } from "./types";

/**
 * PLACEHOLDER LIST — edit freely.
 * Required documents for a Vendor enrollment packet.
 */
export const VENDOR_DOCUMENTS: RequiredDocument[] = [
  {
    key: "form-w9",
    label: "Form W-9 (Taxpayer Identification)",
    hint: "Placeholder — must match the legal business name.",
    required: true,
  },
  {
    key: "business-license",
    label: "Business License",
    hint: "Placeholder — current county or municipal license.",
    required: true,
  },
  {
    key: "certificate-of-insurance",
    label: "Certificate of Liability Insurance",
    hint: "Placeholder — general liability, unexpired.",
    required: true,
  },
  {
    key: "vendor-agreement",
    label: "Signed Vendor Agreement",
    hint: "Placeholder — CFS standard terms.",
    required: true,
  },
  {
    key: "ach-authorization",
    label: "ACH / Remittance Authorization",
    hint: "Placeholder — optional; paper check issued if omitted.",
    required: false,
  },
];
