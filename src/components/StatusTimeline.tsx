import { pipelineFor, STATUS_DOTS, STATUS_STYLES, statusLabel } from "@/config/statuses";
import { formatDateTime } from "@/lib/enrollments";

export type TimelineEvent = {
  id: string;
  status: string;
  note: string | null;
  createdAt: Date;
  changedBy: { name: string; role: string } | null;
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
              STATUS_DOTS[event.status] ?? "bg-slate-400"
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

/**
 * Horizontal progress strip for the enrollee type's own pipeline. Hold states
 * (Missing info) sit off the line — the strip shows where the record stalled.
 */
export function StatusProgress({ current, type }: { current: string; type: string }) {
  const steps = pipelineFor(type).filter((s) => !s.hold);
  const isMissing = current === "MISSING_INFO";
  // A held record stalled after review, so light the strip up to that point.
  const reviewIndex = Math.max(steps.findIndex((s) => s.key === "IN_REVIEW"), 0);
  const activeIndex = isMissing
    ? reviewIndex
    : steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-stretch gap-1.5">
      {steps.map((step, index) => {
        const reached = activeIndex >= index;
        const isCurrent = !isMissing && index === activeIndex;
        const stalledHere = isMissing && index === reviewIndex;
        return (
          <div key={step.key} className="flex-1 min-w-0">
            <div
              className={`h-1.5 rounded-full ${
                stalledHere ? "bg-amber-400" : reached ? "bg-brand-500" : "bg-slate-200"
              }`}
            />
            <p
              className={`mt-1.5 truncate text-[11px] ${
                stalledHere
                  ? "font-semibold text-amber-700"
                  : isCurrent
                    ? "font-semibold text-brand-700"
                    : reached
                      ? "text-slate-600"
                      : "text-slate-400"
              }`}
              title={step.label}
            >
              {stalledHere ? "Missing info" : step.label}
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
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
