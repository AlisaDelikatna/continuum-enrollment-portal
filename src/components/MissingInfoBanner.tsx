import { formatDateTime } from "@/lib/enrollments";

/**
 * The whole point of the Missing info status: the enrollee must be able to see,
 * without hunting, exactly what is outstanding.
 */
export function MissingInfoBanner({
  note,
  at,
  by,
}: {
  note: string;
  at: Date;
  by?: string | null;
}) {
  return (
    <div className="rounded-xl bg-amber-50 p-5 ring-1 ring-inset ring-amber-300">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-400 text-sm font-bold text-white"
        >
          !
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-amber-900">
            We need more information before we can continue
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">{note}</p>
          <p className="mt-3 text-xs text-amber-800">
            Flagged {formatDateTime(at)}
            {by ? ` by ${by}` : ""} · Upload the items below and your enrollment
            returns to review.
          </p>
        </div>
      </div>
    </div>
  );
}
