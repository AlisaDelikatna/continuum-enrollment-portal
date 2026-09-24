/**
 * The six enrollment statuses, in order. Order matters: the status timeline and
 * the admin dropdown both render from this array.
 */
export const STATUSES = [
  "RECEIVED",
  "ACKNOWLEDGED",
  "IN_REVIEW",
  "MISSING_INFO",
  "PROCESSED",
  "ACTIVE",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  RECEIVED: "Received",
  ACKNOWLEDGED: "Acknowledged",
  IN_REVIEW: "In review",
  MISSING_INFO: "Missing info",
  PROCESSED: "Processed",
  ACTIVE: "Active",
};

/** Tailwind classes for the pill badge, per status. */
export const STATUS_STYLES: Record<Status, string> = {
  RECEIVED: "bg-slate-100 text-slate-700 ring-slate-200",
  ACKNOWLEDGED: "bg-sky-50 text-sky-700 ring-sky-200",
  IN_REVIEW: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  MISSING_INFO: "bg-amber-50 text-amber-800 ring-amber-300",
  PROCESSED: "bg-violet-50 text-violet-700 ring-violet-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as Status] ?? status;
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}
