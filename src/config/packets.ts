import type { EnrolleeType } from "./programs";

/**
 * The blank forms Continuum hands an enrollee at the start — the contents of
 * Shavauna Clark's "INTEREST IN CONTINUUM" email, which goes out when someone
 * first expresses interest.
 *
 * NOT to be confused with the "GOOD TO SERVE" / "Good to Go" packages. Those go
 * out at the END, once a participant's PA is live in GAMMIS or an employee's
 * background check comes back eligible, and they carry portal credentials, pay
 * rules and EVV instructions. Nothing in here is approval-gated.
 *
 * Files live in /public/forms and are served as static assets.
 */

export type PacketForm = {
  /** Path under /public. */
  file: string;
  label: string;
  description: string;
  /** packet = fill and return · samples = worked examples · reference = keep */
  kind: "packet" | "samples" | "reference";
};

const EMPLOYEE_RATE_FORM: PacketForm = {
  file: "/forms/employee-rate-form-2025.pdf",
  label: "Employee Rate Form",
  description:
    "One per employee, completed and signed by the participant or representative. Must reach Continuum a week before the pay period ends; retroactive rate changes are not allowed.",
  kind: "packet",
};

const FAMILY_HIRE: PacketForm = {
  file: "/forms/family-hire-request-form.pdf",
  label: "Participant Direction Family Hire Request",
  description:
    "Only if a relative will be paid as a caregiver. Email it to participant.direction@dbhdd.ga.gov — DBHDD is the only approver — then forward the approval to Continuum.",
  kind: "packet",
};

export const PACKETS: Record<EnrolleeType, PacketForm[]> = {
  EMPLOYEE: [
    {
      file: "/forms/2026-employee-packet.pdf",
      label: "Employee Enrollment Packet (2026)",
      description:
        "Every form on your checklist, in one document. Print it, complete it and return the pages to your employer.",
      kind: "packet",
    },
    {
      file: "/forms/employee-samples.pdf",
      label: "Employee Sample Forms",
      description: "Worked examples showing how each form should be filled in.",
      kind: "samples",
    },
    EMPLOYEE_RATE_FORM,
  ],
  PARTICIPANT: [
    {
      file: "/forms/2025-participant-packet.pdf",
      label: "Participant Enrollment Packet (revised January 2025)",
      description:
        "All 25 pages, including the enrollment checklist, the agreements and the tax forms. About 97% of it is the participant's own information.",
      kind: "packet",
    },
    {
      file: "/forms/participant-sample-forms.pdf",
      label: "Participant Sample Forms",
      description: "Worked examples showing how each form should be filled in.",
      kind: "samples",
    },
    {
      file: "/forms/2026-employee-packet.pdf",
      label: "Employee Enrollment Packet (2026)",
      description:
        "For the caregivers you hire. Continuum sends this with your own packet so you have it ready.",
      kind: "reference",
    },
    FAMILY_HIRE,
    EMPLOYEE_RATE_FORM,
  ],
  // Vendors submit a W-9 on their own letterhead; Continuum has no blank packet
  // for them in the enrollment email.
  VENDOR: [],
};

export function packetFor(type: string): PacketForm[] {
  return PACKETS[type as EnrolleeType] ?? [];
}

export const KIND_LABELS: Record<PacketForm["kind"], string> = {
  packet: "Complete and return",
  samples: "Example only",
  reference: "Keep for reference",
};
