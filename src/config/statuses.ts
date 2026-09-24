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
  legacy: LegacyStatus;
  /** A hold, not a forward step — kept off the linear progress strip. */
  hold?: boolean;
};

const MISSING_INFO: StatusDef = {
  key: "MISSING_INFO",
  label: "Missing info",
  description:
    "On hold pending items from the enrollee. The note must say exactly what is outstanding.",
  legacy: "MISSING_INFO",
  hold: true,
};

const COMMON_INTAKE: StatusDef[] = [
  {
    key: "PACKET_SENT",
    label: "Packet sent",
    description:
      "Enrollment submitted and the blank packet issued. Nothing has come back yet.",
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
      "A specialist is checking the packet against the checklist. Allow 24–48 business hours, longer during payroll week.",
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
        "Packet complete. Fingerprint Instructions emailed to the employee with the rep copied — they create a Checkpoint account, submit the application and book an appointment.",
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
        "Portal credentials issued. Only now may the employee work, use EVV, enter time or be paid.",
      legacy: "ACTIVE",
    },
  ],

  PARTICIPANT: [
    ...COMMON_INTAKE,
    MISSING_INFO,
    {
      key: "AWAITING_PA",
      label: "Awaiting PA in GAMMIS",
      description:
        "Paperwork is done; waiting on the support coordinator's prior authorisation to appear in GAMMIS. Continuum cannot load a PA from an email — do not promise a start date until it is visible. Allow up to about a week after the coordinator submits.",
      legacy: "PROCESSED",
    },
    {
      key: "GOOD_TO_SERVE",
      label: "Good to serve",
      description:
        "Notarized RD-1061, ICD-10 code, training certificate and an active PA all in place. Portal login sent; the budget appears on the Budget tab.",
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
