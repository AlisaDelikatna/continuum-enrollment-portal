"use client";

import { useActionState, useState } from "react";
import { STATUSES, statusLabel } from "@/config/statuses";
import { changeStatus, type ActionState } from "@/lib/actions";

/**
 * Admin-only. Every change writes a StatusEvent row with the note, so nothing
 * is ever overwritten — and Missing info refuses to save without a note.
 */
export function StatusChangeForm({
  enrollmentId,
  currentStatus,
  recipientsHint,
}: {
  enrollmentId: string;
  currentStatus: string;
  recipientsHint: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changeStatus,
    null,
  );
  const [selected, setSelected] = useState(currentStatus);

  const nextIndex = STATUSES.indexOf(currentStatus as (typeof STATUSES)[number]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />

      <div>
        <span className="label">New status</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {STATUSES.map((status, index) => (
            <label
              key={status}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm ring-1 ring-inset transition ${
                selected === status
                  ? "bg-brand-50 text-brand-800 ring-brand-400 font-semibold"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={selected === status}
                onChange={() => setSelected(status)}
                className="h-4 w-4 accent-[#0f6d64]"
              />
              <span>{statusLabel(status)}</span>
              {status === currentStatus && (
                <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-400">
                  Current
                </span>
              )}
              {index === nextIndex + 1 && status !== currentStatus && (
                <span className="ml-auto text-[11px] uppercase tracking-wide text-brand-500">
                  Next
                </span>
              )}
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
