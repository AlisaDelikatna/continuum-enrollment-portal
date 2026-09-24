import type { RequiredDocument } from "./types";

/**
 * PLACEHOLDER LIST — edit freely.
 * Required documents for a Participant enrollment packet.
 */
export const PARTICIPANT_DOCUMENTS: RequiredDocument[] = [
  {
    key: "participant-agreement",
    label: "Participant / Employer Agreement",
    hint: "Placeholder — establishes the participant as common-law employer.",
    required: true,
  },
  {
    key: "form-2678",
    label: "IRS Form 2678 (Employer Appointment of Agent)",
    hint: "Placeholder — appoints CFS as fiscal agent.",
    required: true,
  },
  {
    key: "form-8821",
    label: "IRS Form 8821 (Tax Information Authorization)",
    hint: "Placeholder — allows CFS to resolve tax notices.",
    required: true,
  },
  {
    key: "service-plan",
    label: "Approved Individual Service Plan",
    hint: "Placeholder — current plan from the support coordinator.",
    required: true,
  },
  {
    key: "rep-designation",
    label: "Representative Designation Form",
    hint: "Placeholder — optional; only if a rep will act on their behalf.",
    required: false,
  },
];
