import { EnrollWizard } from "@/components/EnrollWizard";

export const metadata = { title: "Enroll — Continuum Fiscal Services" };

export default function EnrollPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <p className="section-title">Enrollment</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        Start your enrollment with Continuum Fiscal Services
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Three steps, about five minutes. You will get an enrollment ID at the end
        and can return to upload documents at any time.
      </p>

      <div className="mt-8">
        <EnrollWizard />
      </div>
    </div>
  );
}
