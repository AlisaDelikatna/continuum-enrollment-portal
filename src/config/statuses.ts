import type { EnrolleeType } from "./programs";

/**
 * Enrollment pipelines.
 *
 * Employees, participants and vendors do not move through the same steps, so
 * each type has its own ordered pipeline drawn from how Continuum actually
 * works (agent call notes 1–22 Sep 2026, plus the packets and the
 * "INTEREST IN CONTINUUM" / "Fingerprint Instructions" / "Good to Go" /
 * "GOOD TO SERVE" emails).
 *
 * LEGACY MAPPING: the original brief specified six generic statuses whose
 * timestamps feed an existing enrollment dashboard. Every status below maps to
 * one of those six, and both values are written to the Enrollment row and to
 * every StatusEvent — so the dashboard can keep querying the old vocabulary
 * while the portal shows what staff and enrollees actually recognise.
 */

/** The original six. Still stored on every row for the existing dashboard. */
export const LEGACY_STATUSES = [
  "RECEIVED",
  "ACKNOWLEDGED",
  "IN_REVIEW",
  "MISSING_INFO",
  "PROCESSED",
  "ACTIVE",
] as const;

export type LegacyStatus = (typeof LEGACY_STATUSES)[number];

export const LEGACY_LABELS: Record<LegacyStatus, string> = {
  RECEIVED: "Received",
  ACKNOWLEDGED: "Acknowledged",
  IN_REVIEW: "In review",
  MISSING_INFO: "Missing info",
  PROCESSED: "Processed",
  ACTIVE: "Active",
};

export type StatusDef = {
  key: string;
  label: string;
  /** What this step means operationally. Shown as help text to admin staff. */
  description: string;
  /** Plain-language version shown to the enrollee on their own status page. */
  guidance?: string;
  legacy: LegacyStatus;
  /** A hold, not a forward step — kept off the linear progress strip. */
  hold?: boolean;
};

const MISSING_INFO: StatusDef = {
  key: "MISSING_INFO",
  label: "Missing info",
  description:
    "On hold pending items from the enrollee. The note must say exactly what is outstanding.",
  guidance:
    "We need a few more things before we can continue. The details are in the note above — upload them below and your enrollment goes back into review.",
  legacy: "MISSING_INFO",
  hold: true,
};

const COMMON_INTAKE: StatusDef[] = [
  {
    key: "PACKET_SENT",
    label: "Packet sent",
    description:
      "Enrollment submitted and the blank packet issued. Nothing has come back yet.",
    guidance:
      "We have your details and your forms are ready to print. Complete them and upload the pages here — there is no deadline, and you can do it in stages.",
    legacy: "RECEIVED",
  },
  {
    key: "PACKET_RECEIVED",
    label: "Packet received",
    description: "Completed paperwork is in and logged. Queued first-in, first-out.",
    legacy: "ACKNOWLEDGED",
  },
  {
    key: "IN_REVIEW",
    label: "In review",
    description:
      "A specialist is checking the packet against the checklist. Queued first-in, first-out; longer during payroll week. End to end a complete participant packet runs about two weeks, an employee packet three weeks to a month because of fingerprinting.",
    guidance:
      "We are checking your packet against the checklist. A complete participant packet takes about two weeks; an employee packet three weeks to a month, because fingerprinting sits in the middle. We will email you the moment anything is missing.",
    legacy: "IN_REVIEW",
  },
];

export const PIPELINES: Record<EnrolleeType, StatusDef[]> = {
  EMPLOYEE: [
    ...COMMON_INTAKE,
    MISSING_INFO,
    {
      key: "FINGERPRINTS_PENDING",
      label: "Fingerprints pending",
      description:
        "Packet complete. Fingerprint Instructions emailed to the employee with the rep copied — they create a Checkpoint account, submit the application and book an appointment. Background pre-approval runs 24–48 hours outside payroll week; results usually land within a week, occasionally up to three.",
      guidance:
        "Your packet is complete and we have emailed you fingerprint instructions. Create your Checkpoint account, submit the application and book an appointment. Results usually come back within a week, occasionally up to three.",
      legacy: "PROCESSED",
    },
    {
      key: "ELIGIBLE",
      label: "Background check eligible",
      description:
        "Results came back eligible. The Good to Go email follows within 24–48 hours.",
      legacy: "PROCESSED",
    },
    {
      key: "GOOD_TO_GO",
      label: "Good to go",
      description:
        "Portal credentials issued. Only now may the employee work, use EVV, enter time or be paid. Separately: the participant's authorisation must also be live before any of it can be billed — EVV visits logged before the PA lands will reject.",
      guidance:
        "You are cleared to work. Your portal login has been sent. If your participant's authorisation is not yet in place, hold off clocking in — visits logged before it lands are rejected.",
      legacy: "ACTIVE",
    },
  ],

  PARTICIPANT: [
    ...COMMON_INTAKE,
    MISSING_INFO,
    {
      key: "AWAITING_PA",
      label: "Awaiting authorisation",
      description:
        "Enrollment here is complete — which is itself a prerequisite for the authorisation, so there is nothing to look up before this point. COMP/NOW: watch for the PA at 'approved' status in IDD-Connects, triggered by the support coordinator's ISP version change. CCSP/SOURCE: the care coordinator enters a SAF, which loads into GAMMIS as the PA. New enrollees can only start on the 1st of the month. Continuum cannot load a PA from an email and does not create PAs — if it has not appeared, the support coordinator or case manager is the first call. ICWP timing is unconfirmed.",
      guidance:
        "Your authorisation is created after your enrollment with us is complete and your support coordinator or case manager submits it. Services can start on the 1st of the following month. If it is not showing, your support coordinator or case manager is the first call.",
      legacy: "PROCESSED",
    },
    {
      key: "GOOD_TO_SERVE",
      label: "Good to serve",
      description:
        "Notarized RD-1061, ICD-10 code, a training certificate still inside its 90 days, and an approved authorisation all in place. Portal login sent; the budget appears on the Budget tab.",
      guidance:
        "You are cleared. Your portal login has been sent, and your budget is on the Budget tab.",
      legacy: "ACTIVE",
    },
  ],

  VENDOR: [
    ...COMMON_INTAKE,
    MISSING_INFO,
    {
      key: "AWAITING_STATE_APPROVAL",
      label: "Awaiting DBHDD approval",
      description:
        "The service may not be covered under an authorised code, so the state has to approve it in writing. Being in the ISP is not enough.",
      legacy: "PROCESSED",
    },
    {
      key: "APPROVED_VENDOR",
      label: "Approved vendor",
      description:
        "Set up and payable. Invoices go to invoices@continuumfs.com, signed off by the representative.",
      legacy: "ACTIVE",
    },
  ],
};

/** Every distinct status across all three pipelines, in a stable order. */
export const ALL_STATUSES: StatusDef[] = (() => {
  const seen = new Map<string, StatusDef>();
  for (const type of ["EMPLOYEE", "PARTICIPANT", "VENDOR"] as EnrolleeType[]) {
    for (const def of PIPELINES[type]) if (!seen.has(def.key)) seen.set(def.key, def);
  }
  return [...seen.values()];
})();

export function pipelineFor(type: string): StatusDef[] {
  return PIPELINES[type as EnrolleeType] ?? PIPELINES.EMPLOYEE;
}

export function statusDef(key: string): StatusDef | undefined {
  return ALL_STATUSES.find((s) => s.key === key);
}

export function statusLabel(key: string): string {
  return statusDef(key)?.label ?? LEGACY_LABELS[key as LegacyStatus] ?? key;
}

export function statusDescription(key: string): string {
  return statusDef(key)?.description ?? "";
}

/** Enrollee-facing copy for the current step, if there is any. */
export function statusGuidance(key: string): string | null {
  return statusDef(key)?.guidance ?? null;
}

/** The legacy bucket this status rolls up to, for the existing dashboard. */
export function legacyOf(key: string): LegacyStatus {
  return statusDef(key)?.legacy ?? "RECEIVED";
}

export function isStatusFor(type: string, key: string): boolean {
  return pipelineFor(type).some((s) => s.key === key);
}

/** The first status a brand-new enrollment lands on. */
export const INITIAL_STATUS = "PACKET_SENT";

export const STATUS_STYLES: Record<string, string> = {
  PACKET_SENT: "bg-slate-100 text-slate-700 ring-slate-200",
  PACKET_RECEIVED: "bg-sky-50 text-sky-700 ring-sky-200",
  IN_REVIEW: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  MISSING_INFO: "bg-amber-50 text-amber-800 ring-amber-300",
  FINGERPRINTS_PENDING: "bg-violet-50 text-violet-700 ring-violet-200",
  ELIGIBLE: "bg-teal-50 text-teal-700 ring-teal-200",
  GOOD_TO_GO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  AWAITING_PA: "bg-violet-50 text-violet-700 ring-violet-200",
  GOOD_TO_SERVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  AWAITING_STATE_APPROVAL: "bg-violet-50 text-violet-700 ring-violet-200",
  APPROVED_VENDOR: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const STATUS_DOTS: Record<string, string> = {
  PACKET_SENT: "bg-slate-400",
  PACKET_RECEIVED: "bg-sky-500",
  IN_REVIEW: "bg-indigo-500",
  MISSING_INFO: "bg-amber-500",
  FINGERPRINTS_PENDING: "bg-violet-500",
  ELIGIBLE: "bg-teal-500",
  GOOD_TO_GO: "bg-emerald-500",
  AWAITING_PA: "bg-violet-500",
  GOOD_TO_SERVE: "bg-emerald-500",
  AWAITING_STATE_APPROVAL: "bg-violet-500",
  APPROVED_VENDOR: "bg-emerald-500",
};
