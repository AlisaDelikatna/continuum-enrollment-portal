"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { documentsFor, OTHER_DOCUMENT } from "@/config/documents";
import {
  ENROLLEE_TYPES,
  PROGRAM_LABELS,
  PROGRAMS,
  TYPE_BLURBS,
  TYPE_LABELS,
  type EnrolleeType,
} from "@/config/programs";
import { createEnrollment, uploadDocuments, type CreatedEnrollment } from "@/lib/actions";
import { StatusBadge } from "./StatusBadge";

const STEPS = ["Enrollee type", "Your details", "Documents", "Confirmation"];

export function EnrollWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<EnrolleeType | null>(null);
  const [created, setCreated] = useState<CreatedEnrollment | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Stepper current={step} />

      {error && (
        <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {step === 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Who is enrolling?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick the option that describes you. This decides which forms and
            documents we ask for.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {ENROLLEE_TYPES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setType(option);
                  setError(null);
                  setStep(1);
                }}
                className={`card card-pad text-left transition hover:ring-brand-400 hover:shadow ${
                  type === option ? "ring-2 ring-brand-500" : ""
                }`}
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {TYPE_LABELS[option]}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{TYPE_BLURBS[option]}</p>
                <p className="mt-4 text-sm font-semibold text-brand-600">
                  {documentsFor(option).filter((d) => d.required).length} required documents →
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && type && (
        <section className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {TYPE_LABELS[type]} details
            </h2>
            <button type="button" className="btn-ghost" onClick={() => setStep(0)}>
              ← Change type
            </button>
          </div>

          <form
            className="mt-5 card card-pad space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setError(null);
              startTransition(async () => {
                try {
                  const result = await createEnrollment({
                    type,
                    program: String(data.get("program") ?? ""),
                    name: String(data.get("name") ?? ""),
                    email: String(data.get("email") ?? ""),
                    phone: String(data.get("phone") ?? ""),
                    participantName: String(data.get("participantName") ?? ""),
                    repName: String(data.get("repName") ?? ""),
                    repEmail: String(data.get("repEmail") ?? ""),
                    businessName: String(data.get("businessName") ?? ""),
                    contactName: String(data.get("contactName") ?? ""),
                  });
                  setCreated(result);
                  setStep(2);
                } catch (submitError) {
                  setError(
                    submitError instanceof Error
                      ? submitError.message
                      : "We could not save that. Check the form and try again.",
                  );
                }
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={type === "VENDOR" ? "Primary contact name" : "Full name"}
                name="name"
                required
                placeholder={type === "VENDOR" ? "Dana Whitfield" : "Jordan Ellis"}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
              />
              <Field label="Phone" name="phone" placeholder="(404) 555-0143" />
              <div>
                <label className="label" htmlFor="program">
                  Waiver program <span className="text-rose-600">*</span>
                </label>
                <select id="program" name="program" required className="input" defaultValue="">
                  <option value="" disabled>
                    Select a program…
                  </option>
                  {PROGRAMS.map((program) => (
                    <option key={program} value={program}>
                      {PROGRAM_LABELS[program]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {type === "EMPLOYEE" && (
              <fieldset className="rounded-lg bg-slate-50 p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Who you work for
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Participant you work for"
                    name="participantName"
                    placeholder="Marcus Alvarado"
                  />
                  <div className="hidden sm:block" />
                  <Field
                    label="Representative name"
                    name="repName"
                    optional
                    placeholder="Priya Raman"
                  />
                  <Field
                    label="Representative email"
                    name="repEmail"
                    type="email"
                    optional
                    placeholder="rep@example.com"
                  />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  If your representative already works with us we&apos;ll link them to
                  your record automatically; otherwise an admin assigns one.
                </p>
              </fieldset>
            )}

            {type === "VENDOR" && (
              <fieldset className="rounded-lg bg-slate-50 p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Business
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Legal business name"
                    name="businessName"
                    required
                    placeholder="Peachtree Mobility Supply LLC"
                  />
                  <Field
                    label="Billing contact"
                    name="contactName"
                    placeholder="Accounts receivable contact"
                  />
                </div>
              </fieldset>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? "Submitting…" : "Continue to documents"}
              </button>
              <span className="text-xs text-slate-500">
                Fields marked * are required.
              </span>
            </div>
          </form>
        </section>
      )}

      {step === 2 && created && type && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Upload your documents
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Enrollment <span className="font-mono font-semibold">{created.refId}</span>{" "}
            is saved. Attach what you have now — anything you skip can be uploaded
            later from your status page.
          </p>

          <form
            className="mt-5 card card-pad space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setError(null);
              startTransition(async () => {
                const response = await uploadDocuments(data);
                if (!response.ok && response.uploaded === 0) {
                  setUploadSummary("No files attached — you can upload them later.");
                } else {
                  setUploadSummary(response.message);
                }
                setStep(3);
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="enrollmentId" value={created.id} />
            <ul className="divide-y divide-slate-100">
              {[...documentsFor(type), OTHER_DOCUMENT].map((doc) => (
                <li key={doc.key} className="py-3 first:pt-0 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {doc.label}
                      {doc.required ? (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                          Required
                        </span>
                      ) : (
                        <span className="ml-2 text-[11px] uppercase tracking-wide text-slate-400">
                          Optional
                        </span>
                      )}
                    </p>
                    {doc.hint && <p className="mt-0.5 text-xs text-slate-500">{doc.hint}</p>}
                  </div>
                  <input
                    type="file"
                    name={`file:${doc.key}`}
                    aria-label={doc.label}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0
                      file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700
                      hover:file:bg-slate-200"
                  />
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? "Uploading…" : "Upload and finish"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={pending}
                onClick={() => {
                  setUploadSummary("Skipped for now — upload from your status page any time.");
                  setStep(3);
                }}
              >
                Skip for now
              </button>
            </div>
          </form>
        </section>
      )}

      {step === 3 && created && (
        <section className="mt-6">
          <div className="card card-pad">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-lg text-emerald-700"
              >
                ✓
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Enrollment submitted
                </h2>
                <p className="text-sm text-slate-600">
                  We emailed a confirmation to the address on the form.
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Enrollment ID
                </dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-slate-900">
                  {created.refId}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Current status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={created.status} />
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Enrollee type
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {TYPE_LABELS[created.type as EnrolleeType] ?? created.type}
                </dd>
              </div>
            </dl>

            {uploadSummary && (
              <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {uploadSummary}
              </p>
            )}

            <p className="mt-4 text-sm text-slate-600">
              You are now signed in as this enrollee, so the header switcher shows
              your name.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/me" className="btn-primary">
                View my status page
              </Link>
              <Link href="/outbox" className="btn-secondary">
                See the confirmation email
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((label, index) => {
        const state =
          index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
              state === "current"
                ? "bg-brand-600 text-white font-semibold"
                : state === "done"
                  ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200"
                  : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200"
            }`}
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
                state === "current"
                  ? "bg-white/20 text-white"
                  : state === "done"
                    ? "bg-brand-200 text-brand-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  optional,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span className="text-rose-600"> *</span>}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}
