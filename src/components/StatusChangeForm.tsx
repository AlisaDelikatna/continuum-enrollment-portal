"use client";

import { useActionState, useState } from "react";
import { pipelineFor } from "@/config/statuses";
import { changeStatus, type ActionState } from "@/lib/actions";

/**
 * Admin-only. Every change writes a StatusEvent row with the note, so nothing
 * is ever overwritten — and Missing info refuses to save without a note.
 */
export function StatusChangeForm({
  enrollmentId,
  enrolleeType,
  currentStatus,
  recipientsHint,
}: {
  enrollmentId: string;
  enrolleeType: string;
  currentStatus: string;
  recipientsHint: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changeStatus,
    null,
  );
  const [selected, setSelected] = useState(currentStatus);

  const steps = pipelineFor(enrolleeType);
  const nextIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />

      <div>
        <span className="label">New status</span>
        <div className="grid gap-2">
          {steps.map((step, index) => (
            <label
              key={step.key}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ring-1 ring-inset transition ${
                selected === step.key
                  ? "bg-brand-50 text-brand-900 ring-brand-400"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={step.key}
                checked={selected === step.key}
                onChange={() => setSelected(step.key)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#0f6d64]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={selected === step.key ? "font-semibold" : "font-medium"}>
                    {step.label}
                  </span>
                  {step.key === currentStatus && (
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      Current
                    </span>
                  )}
                  {index === nextIndex + 1 && step.key !== currentStatus && (
                    <span className="text-[11px] uppercase tracking-wide text-brand-500">
                      Next
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {step.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          Note
          {selected === "MISSING_INFO" ? (
            <span className="text-rose-600"> * required — say exactly what is missing</span>
          ) : (
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          )}
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          required={selected === "MISSING_INFO"}
          placeholder={
            selected === "MISSING_INFO"
              ? "e.g. Form I-9 page 2 is unsigned and the voided check for direct deposit is missing."
              : "Context for the enrollee and the audit trail."
          }
          className="input"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save status & notify"}
        </button>
        <span className="text-xs text-slate-500">Emails: {recipientsHint}</span>
      </div>

      {state && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.ok
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
              : "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
