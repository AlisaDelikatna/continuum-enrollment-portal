"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { OTHER_DOCUMENT, type RequiredDocument } from "@/config/documents";
import { uploadDocuments } from "@/lib/actions";

/**
 * Single-slot upload used on /me, /rep/[id] and /admin/[id].
 * `onBehalfOf` is only a label — the server decides who is allowed to upload.
 */
export function UploadForm({
  enrollmentId,
  documents,
  onBehalfOf,
}: {
  enrollmentId: string;
  documents: RequiredDocument[];
  onBehalfOf?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const slots = [...documents, OTHER_DOCUMENT];

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setResult(null);
        startTransition(async () => {
          const response = await uploadDocuments(data);
          setResult(response);
          if (response.ok) {
            formRef.current?.reset();
            router.refresh();
          }
        });
      }}
      className="space-y-3"
    >
      <input type="hidden" name="enrollmentId" value={enrollmentId} />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <label className="label" htmlFor={`docKey-${enrollmentId}`}>
            Document type
          </label>
          <select id={`docKey-${enrollmentId}`} name="docKey" className="input" defaultValue={slots[0]?.key}>
            {slots.map((doc) => (
              <option key={doc.key} value={doc.key}>
                {doc.label}
                {doc.required ? "" : " (optional)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`file-${enrollmentId}`}>
            File
          </label>
          <input
            id={`file-${enrollmentId}`}
            type="file"
            name="file"
            required
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0
              file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700
              hover:file:bg-slate-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Uploading…" : "Upload document"}
        </button>
        {onBehalfOf && (
          <span className="text-xs text-slate-500">Uploading on behalf of {onBehalfOf}</span>
        )}
      </div>

      {result && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
              : "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200"
          }`}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
