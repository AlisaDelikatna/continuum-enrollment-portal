"use client";

import { useActionState } from "react";
import { sendDigest, type ActionState } from "@/lib/actions";

/**
 * "Send today's digest" — one email to admin staff listing every document
 * uploaded on the chosen date. The date defaults to today but is editable so a
 * demo can show a day that already has seeded uploads.
 */
export function DigestButton({
  defaultDate,
  uploadsToday,
}: {
  defaultDate: string;
  uploadsToday: number;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    sendDigest,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="digest-date">
            Digest date
          </label>
          <input
            id="digest-date"
            type="date"
            name="date"
            defaultValue={defaultDate}
            className="input w-auto"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Building…" : "Send today's digest"}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        {uploadsToday} document{uploadsToday === 1 ? "" : "s"} uploaded today. Uploads
        never trigger their own email — they collect here.
      </p>
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
