import type { EnrolleeType } from "./programs";

/**
 * The end-to-end journey, including the parts Continuum does not control.
 *
 * The pipeline in statuses.ts is what *Continuum* does with a record. This is
 * what the enrollee experiences, and it is deliberately wider: it starts before
 * they contact us and includes the support coordinator's budget submission.
 *
 * The point of separating owners is call deflection. "Why is this taking so
 * long" is usually a step nobody told them was someone else's to do.
 *
 * Participant sequence corrected by Shavauna Clark, 23–24 Sep 2026.
 */

export type StepOwner = "ENROLLEE" | "COORDINATOR" | "CONTINUUM";

export const OWNER_LABELS: Record<StepOwner, string> = {
  ENROLLEE: "Your step",
  COORDINATOR: "Support coordinator",
  CONTINUUM: "Continuum",
};

export const OWNER_STYLES: Record<StepOwner, string> = {
  ENROLLEE: "bg-brand-50 text-brand-700 ring-brand-200",
  COORDINATOR: "bg-amber-50 text-amber-800 ring-amber-300",
  CONTINUUM: "bg-slate-100 text-slate-600 ring-slate-200",
};

export type JourneyStep = {
  key: string;
  title: string;
  detail: string;
  owner: StepOwner;
  /** Pipeline statuses that mean this step is the current one. */
  statuses?: string[];
  /** Only applies to these waivers. Shown greyed out for everyone else. */
  programs?: string[];
  /** Shown as a reassurance callout under the step. */
  note?: string;
};

export const JOURNEYS: Record<EnrolleeType, JourneyStep[]> = {
  PARTICIPANT: [
    {
      key: "confirm-waiver",
      title: "Confirm which waiver you are on",
      detail:
        "Ask your support coordinator. This comes before everything else, because the waiver decides whether the training step applies to you.",
      owner: "ENROLLEE",
    },
    {
      key: "training",
      title: "Complete the self-directed training",
      detail:
        "Roughly 4–5 hours, virtual, run by DBHDD. The certificate is valid for 90 days and goes in the packet.",
      owner: "ENROLLEE",
      programs: ["COMP", "NOW"],
    },
    {
      key: "submit-packet",
      title: "Submit your enrollment packet",
      detail:
        "Information and agreement forms, release, powers of attorney and the tax forms. Your exact list is below — it is tailored to your waiver.",
      owner: "ENROLLEE",
      statuses: ["PACKET_SENT", "PACKET_RECEIVED", "IN_REVIEW", "MISSING_INFO"],
      note: "You do not need your budget to do this. Enrollment goes ahead without it, and the two run in parallel.",
    },
    {
      key: "budget",
      title: "Your budget (PA) is submitted and approved",
      detail:
        "Your support coordinator submits it. It then shows as approved in IDD-Connects. Continuum checks weekly and cannot submit it or speed it up — if it has not appeared, your support coordinator is the first call.",
      owner: "COORDINATOR",
      statuses: ["AWAITING_PA"],
    },
    {
      key: "services-start",
      title: "Services and billing start",
      detail:
        "Once your enrollment is complete and your budget is live. For NOW and COMP this is the 1st of the month.",
      owner: "CONTINUUM",
      statuses: ["GOOD_TO_SERVE"],
    },
  ],

  EMPLOYEE: [
    {
      key: "employee-or-vendor",
      title: "Confirm you are enrolling as an employee",
      detail:
        "Employees are hired by the participant and paid through payroll. A business billing for a product or service is a vendor instead, and follows a different path.",
      owner: "ENROLLEE",
    },
    {
      key: "submit-packet",
      title: "Complete and return your packet",
      detail:
        "Every form on your checklist, returned to your employer. The two things that most often hold a packet up are an unsigned I-9 and a missing relationship to the participant.",
      owner: "ENROLLEE",
      statuses: ["PACKET_SENT", "PACKET_RECEIVED", "IN_REVIEW", "MISSING_INFO"],
    },
    {
      key: "fingerprints",
      title: "Fingerprints through Checkpoint",
      detail:
        "Once your packet is complete we email instructions. Create a Checkpoint account, submit the application and book an appointment. Results usually come back within a week, occasionally up to three.",
      owner: "ENROLLEE",
      statuses: ["FINGERPRINTS_PENDING", "ELIGIBLE"],
    },
    {
      key: "good-to-go",
      title: "Good to go",
      detail:
        "Portal credentials are issued and you may start work, use EVV and be paid.",
      owner: "CONTINUUM",
      statuses: ["GOOD_TO_GO"],
      note: "Your participant's budget must also be live before anything can be billed. Visits logged before it lands are rejected.",
    },
  ],

  VENDOR: [
    {
      key: "confirm-vendor",
      title: "Confirm you are enrolling as a vendor",
      detail:
        "Vendors bill for a product or service against their own EIN. There is no employer relationship, no background check and no EVV.",
      owner: "ENROLLEE",
    },
    {
      key: "submit-w9",
      title: "Send your Form W-9",
      detail: "Carrying your own EIN, matching your legal business name.",
      owner: "ENROLLEE",
      statuses: ["PACKET_SENT", "PACKET_RECEIVED", "IN_REVIEW", "MISSING_INFO"],
    },
    {
      key: "service-approval",
      title: "Service approval, if needed",
      detail:
        "The service must sit on the participant's budget under a code Continuum is authorised for. If it might not be covered, the state has to approve it in writing first — being in the ISP is not enough.",
      owner: "CONTINUUM",
      statuses: ["AWAITING_STATE_APPROVAL"],
    },
    {
      key: "approved",
      title: "Approved and payable",
      detail:
        "Send invoices to invoices@continuumfs.com, signed off by the representative.",
      owner: "CONTINUUM",
      statuses: ["APPROVED_VENDOR"],
    },
  ],
};

export function journeyFor(type: string): JourneyStep[] {
  return JOURNEYS[type as EnrolleeType] ?? [];
}

export function stepApplies(step: JourneyStep, programs: string[]): boolean {
  return !step.programs || step.programs.some((p) => programs.includes(p));
}
