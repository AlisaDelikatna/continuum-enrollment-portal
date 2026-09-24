"use client";

import { useActionState } from "react";
import { assignRep, type ActionState } from "@/lib/actions";

export function RepAssignForm({
  enrollmentId,
  currentRepId,
  reps,
  typedRep,
}: {
  enrollmentId: string;
  currentRepId: string | null;
  reps: Array<{ id: string; name: string; email: string; caseload: number }>;
  typedRep?: string | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    assignRep,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <div>
        <label className="label" htmlFor="repId">
          Assigned representative
        </label>
        <select id="repId" name="repId" defaultValue={currentRepId ?? ""} className="input">
          <option value="">Unassigned</option>
          {reps.map((rep) => (
            <option key={rep.id} value={rep.id}>
              {rep.name} — {rep.email} ({rep.caseload} employee
              {rep.caseload === 1 ? "" : "s"})
            </option>
          ))}
        </select>
      </div>

      {!currentRepId && typedRep && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
          The employee typed &ldquo;{typedRep}&rdquo; on their form but no matching rep
          was on file. Pick the right one above.
        </p>
      )}

      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? "Saving…" : "Save assignment"}
      </button>

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
