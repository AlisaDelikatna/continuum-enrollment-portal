import { KIND_LABELS, packetFor } from "@/config/packets";

const KIND_STYLES: Record<string, string> = {
  packet: "bg-brand-50 text-brand-700 ring-brand-200",
  samples: "bg-slate-100 text-slate-600 ring-slate-200",
  reference: "bg-sky-50 text-sky-700 ring-sky-200",
};

/**
 * The blank forms to print and fill — the same set Continuum emails when
 * someone first enquires. Shown at the document step and again on the
 * enrollee's status page so they can get them back at any time.
 */
export function PacketDownloads({ type }: { type: string }) {
  const forms = packetFor(type);
  if (forms.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        There is no standard blank packet for vendors — submit a Form W-9 carrying
        your own EIN, and an invoice once work is complete.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {forms.map((form) => (
        <li key={form.file + form.label} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{form.label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                    KIND_STYLES[form.kind]
                  }`}
                >
                  {KIND_LABELS[form.kind]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{form.description}</p>
            </div>
            <a
              href={form.file}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
            >
              Open / print PDF
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
