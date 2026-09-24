import { documentsFor, OTHER_DOCUMENT } from "@/config/documents";
import { formatDateTime } from "@/lib/enrollments";
import { formatBytes } from "@/lib/storage";

export type DocumentRow = {
  id: string;
  docKey: string;
  label: string;
  originalName: string;
  size: number;
  createdAt: Date;
  uploadedBy: { name: string; role: string } | null;
};

/**
 * Required slots for the enrollee type, each showing its uploads or a
 * "not received" marker, followed by anything filed under "Other".
 */
export function DocumentChecklist({
  type,
  documents,
  programs = [],
}: {
  type: string;
  documents: DocumentRow[];
  /** Program codes on the enrollment — some requirements are waiver-specific. */
  programs?: string[];
}) {
  const slots = documentsFor(type, programs);
  const byKey = new Map<string, DocumentRow[]>();
  for (const doc of documents) {
    byKey.set(doc.docKey, [...(byKey.get(doc.docKey) ?? []), doc]);
  }
  const extras = byKey.get(OTHER_DOCUMENT.key) ?? [];

  return (
    <ul className="divide-y divide-slate-100">
      {slots.map((slot) => {
        const uploads = byKey.get(slot.key) ?? [];
        const received = uploads.length > 0;
        return (
          <li key={slot.key} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  received
                    ? "bg-emerald-100 text-emerald-700"
                    : slot.required
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {received ? "✓" : slot.required ? "!" : "–"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-slate-900">{slot.label}</span>
                  {!slot.required && (
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      Optional
                    </span>
                  )}
                  {slot.programs && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {slot.programs.join("/")} only
                    </span>
                  )}
                  {slot.unconfirmed && (
                    <span
                      title="From only a few source calls — confirm with a supervisor."
                      className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                    >
                      Unconfirmed
                    </span>
                  )}
                </div>
                {slot.hint && <p className="mt-0.5 text-xs text-slate-500">{slot.hint}</p>}
                {uploads.map((doc) => (
                  <FileLine key={doc.id} doc={doc} />
                ))}
                {!received && (
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Not received</p>
                )}
              </div>
            </div>
          </li>
        );
      })}

      {extras.length > 0 && (
        <li className="py-3 last:pb-0">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500"
            >
              +
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-slate-900">
                {OTHER_DOCUMENT.label}
              </span>
              {extras.map((doc) => (
                <FileLine key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        </li>
      )}
    </ul>
  );
}

function FileLine({ doc }: { doc: DocumentRow }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
      <a
        href={`/api/documents/${doc.id}`}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-brand-600 hover:text-brand-700 hover:underline break-all"
      >
        {doc.originalName}
      </a>
      <span className="text-slate-300">·</span>
      <span>{formatBytes(doc.size)}</span>
      <span className="text-slate-300">·</span>
      <span>{formatDateTime(doc.createdAt)}</span>
      {doc.uploadedBy && (
        <>
          <span className="text-slate-300">·</span>
          <span>
            by {doc.uploadedBy.name}
            <span className="text-slate-400"> ({doc.uploadedBy.role.toLowerCase()})</span>
          </span>
        </>
      )}
    </div>
  );
}
