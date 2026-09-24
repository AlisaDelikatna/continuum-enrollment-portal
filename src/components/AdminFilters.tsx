"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ENROLLEE_TYPES, PROGRAMS, TYPE_LABELS } from "@/config/programs";
import { STATUSES, statusLabel } from "@/config/statuses";

/** Type / program / status / search filters, kept in the URL so views are shareable. */
export function AdminFilters({ total, shown }: { total: number; shown: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`/admin?${next.toString()}`));
  };

  const filtered = ["type", "program", "status", "q"].some((key) => params.get(key));

  return (
    <div className="card card-pad">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="filter-type">
            Enrollee type
          </label>
          <select
            id="filter-type"
            className="input"
            value={params.get("type") ?? ""}
            onChange={(e) => update("type", e.target.value)}
          >
            <option value="">All types</option>
            {ENROLLEE_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-program">
            Program
          </label>
          <select
            id="filter-program"
            className="input"
            value={params.get("program") ?? ""}
            onChange={(e) => update("program", e.target.value)}
          >
            <option value="">All programs</option>
            {PROGRAMS.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            className="input"
            value={params.get("status") ?? ""}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-q">
            Search
          </label>
          <input
            id="filter-q"
            className="input"
            placeholder="Name, email or ID"
            defaultValue={params.get("q") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value.trim());
            }}
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value !== (params.get("q") ?? "")) update("q", value);
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>
          Showing <strong className="text-slate-900">{shown}</strong> of {total} enrollments
          {pending && <span className="ml-2 text-slate-400">updating…</span>}
        </span>
        {filtered && (
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() => startTransition(() => router.push("/admin"))}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
