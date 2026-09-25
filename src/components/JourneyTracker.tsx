import { journeyFor, OWNER_LABELS, OWNER_STYLES, stepApplies } from "@/config/journey";

/**
 * The whole journey, not just Continuum's part of it, with each step labelled
 * by whose move it is. Steps that do not apply to this waiver stay visible and
 * greyed — people ask whether the training applies to them, so answering it
 * explicitly beats hiding the row.
 */
export function JourneyTracker({
  type,
  status,
  programs,
}: {
  type: string;
  status: string;
  programs: string[];
}) {
  const steps = journeyFor(type);
  if (steps.length === 0) return null;

  const applicable = steps.filter((s) => stepApplies(s, programs));
  const currentIndex = applicable.findIndex((s) => s.statuses?.includes(status));

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const applies = stepApplies(step, programs);
        // Position within the applicable steps, so a skipped row never shifts
        // the "done / current / upcoming" reckoning.
        const position = applicable.indexOf(step);
        const isCurrent = applies && position >= 0 && position === currentIndex;
        const isDone =
          applies && currentIndex >= 0 && position >= 0 && position < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[11px] top-7 bottom-0 w-px ${
                  isDone ? "bg-brand-300" : "bg-slate-200"
                }`}
              />
            )}
            <Marker applies={applies} isCurrent={isCurrent} isDone={isDone} index={position} />

            <div className={`min-w-0 flex-1 ${applies ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-sm ${
                    isCurrent
                      ? "font-semibold text-brand-800"
                      : applies
                        ? "font-medium text-slate-900"
                        : "font-medium text-slate-500 line-through decoration-slate-300"
                  }`}
                >
                  {step.title}
                </h3>
                {applies ? (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                      OWNER_STYLES[step.owner]
                    }`}
                  >
                    {OWNER_LABELS[step.owner]}
                  </span>
                ) : (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200">
                    Not required for your waiver
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    You are here
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-600">{step.detail}</p>

              {applies && step.note && (
                <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-inset ring-sky-200">
                  {step.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({
  applies,
  isCurrent,
  isDone,
  index,
}: {
  applies: boolean;
  isCurrent: boolean;
  isDone: boolean;
  index: number;
}) {
  const base =
    "relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ring-4 ring-white";
  if (!applies) {
    return (
      <span aria-hidden className={`${base} bg-slate-100 text-slate-400`}>
        –
      </span>
    );
  }
  if (isDone) {
    return (
      <span aria-hidden className={`${base} bg-brand-600 text-white`}>
        ✓
      </span>
    );
  }
  if (isCurrent) {
    return (
      <span aria-hidden className={`${base} bg-brand-600 text-white`}>
        {index + 1}
      </span>
    );
  }
  return (
    <span aria-hidden className={`${base} bg-slate-200 text-slate-600`}>
      {index + 1}
    </span>
  );
}
