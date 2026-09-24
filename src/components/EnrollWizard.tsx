"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { documentsFor, OTHER_DOCUMENT } from "@/config/documents";
import {
  EMPLOYEE_VS_VENDOR,
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
  const [programs, setPrograms] = useState<string[]>([]);
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
                  setPrograms([]);
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

          <details className="mt-5 card card-pad">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              Not sure whether a caregiver is an employee or a vendor?
              <span className="ml-2 font-normal text-brand-600">Compare →</span>
            </summary>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-head w-40">&nbsp;</th>
                    <th className="table-head">Employee</th>
                    <th className="table-head">Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {EMPLOYEE_VS_VENDOR.map((row) => (
                    <tr key={row.aspect}>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-900 align-top">
                        {row.aspect}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600 align-top">
                        {row.employee}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600 align-top">
                        {row.vendor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              The service must sit on the participant&apos;s PA/budget under a code
              Continuum is authorised for. If it might not be covered, the state has
              to approve it in writing before a vendor can be added — being in the
              ISP is not enough.
            </p>
          </details>
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
              if (programs.length === 0) {
                setError("Select at least one waiver program.");
                return;
              }
              startTransition(async () => {
                try {
                  const result = await createEnrollment({
                    type,
                    programs,
                    name: String(data.get("name") ?? ""),
                    email: String(data.get("email") ?? ""),
                    phone: String(data.get("phone") ?? ""),
                    participantName: String(data.get("participantName") ?? ""),
                    relationship: String(data.get("relationship") ?? ""),
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
            </div>

            <fieldset>
              <legend className="label">
                Waiver programs <span className="text-rose-600">*</span>
                <span className="ml-1 font-normal text-slate-400">
                  select every program that applies
                </span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROGRAMS.map((program) => {
                  const checked = programs.includes(program);
                  return (
                    <label
                      key={program}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ring-1 ring-inset transition ${
                        checked
                          ? "bg-brand-50 text-brand-900 ring-brand-400"
                          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="programs"
                        value={program}
                        checked={checked}
                        onChange={(event) =>
                          setPrograms((current) =>
                            event.target.checked
                              ? [...current, program]
                              : current.filter((p) => p !== program),
                          )
                        }
                        className="mt-0.5 h-4 w-4 accent-[#0f6d64]"
                      />
                      <span>
                        <span className="font-semibold">{program}</span>
                        <span className="block text-xs text-slate-500">
                          {PROGRAM_LABELS[program].split(" — ")[1]}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

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
                  <Field
                    label="Your relationship to them"
                    name="relationship"
                    placeholder="Daughter, neighbour, no relation…"
                  />
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
                  A missing relationship is one of the two most common reasons a
                  packet is held. If your representative already works with us
                  we&apos;ll link them to your record automatically; otherwise an
                  admin assigns one.
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
              {[...documentsFor(type, created.programs), OTHER_DOCUMENT].map((doc) => (
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
                      {doc.programs && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {doc.programs.join("/")} only
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
              <Link href="/enroll" className="btn-secondary">
                Enroll someone else
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
