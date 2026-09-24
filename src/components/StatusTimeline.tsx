import { STATUS_STYLES, statusLabel, type Status } from "@/config/statuses";
import { formatDateTime } from "@/lib/enrollments";

export type TimelineEvent = {
  id: string;
  status: string;
  note: string | null;
  createdAt: Date;
  changedBy: { name: string; role: string } | null;
};

const DOT: Record<Status, string> = {
  RECEIVED: "bg-slate-400",
  ACKNOWLEDGED: "bg-sky-500",
  IN_REVIEW: "bg-indigo-500",
  MISSING_INFO: "bg-amber-500",
  PROCESSED: "bg-violet-500",
  ACTIVE: "bg-emerald-500",
};

/** Newest first — reads like an audit log, which is what admins expect. */
export function StatusTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No status history yet.</p>;
  }

  return (
    <ol className="relative">
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < events.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200"
            />
          )}
          <span
            aria-hidden
            className={`relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white ${
              DOT[event.status as Status] ?? "bg-slate-400"
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`text-sm font-semibold ${
                  index === 0 ? "text-slate-900" : "text-slate-700"
                }`}
              >
                {statusLabel(event.status)}
              </span>
              <time className="text-xs text-slate-500">
                {formatDateTime(event.createdAt)}
              </time>
              {event.changedBy && (
                <span className="text-xs text-slate-400">
                  by {event.changedBy.name}
                </span>
              )}
            </div>
            {event.note && (
              <p
                className={`mt-1.5 rounded-lg px-3 py-2 text-sm ${
                  event.status === "MISSING_INFO"
                    ? "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200"
                    : "bg-slate-50 text-slate-600"
                }`}
              >
                {event.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Small horizontal progress strip used at the top of status pages. */
export function StatusProgress({ current }: { current: string }) {
  const order: Status[] = [
    "RECEIVED",
    "ACKNOWLEDGED",
    "IN_REVIEW",
    "PROCESSED",
    "ACTIVE",
  ];
  const isMissing = current === "MISSING_INFO";
  const activeIndex = isMissing ? 2 : order.indexOf(current as Status);

  return (
    <div className="flex items-stretch gap-1.5">
      {order.map((step, index) => {
        const reached = activeIndex >= index;
        const isCurrent = !isMissing && index === activeIndex;
        return (
          <div key={step} className="flex-1 min-w-0">
            <div
              className={`h-1.5 rounded-full ${
                isMissing && index === 2
                  ? "bg-amber-400"
                  : reached
                    ? "bg-brand-500"
                    : "bg-slate-200"
              }`}
            />
            <p
              className={`mt-1.5 truncate text-[11px] ${
                isCurrent
                  ? "font-semibold text-brand-700"
                  : reached
                    ? "text-slate-600"
                    : "text-slate-400"
              }`}
            >
              {isMissing && index === 2 ? "Missing info" : statusLabel(step)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status as Status] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
