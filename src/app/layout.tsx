import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Continuum Fiscal Services — Enrollment Portal",
  description:
    "Enrollment and document intake for Georgia self-directed waiver programs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 justify-between">
            <span>
              Continuum Fiscal Services · 260 Peachtree St NW, Suite 1903,
              Atlanta, GA 30303 · 678-974-7942 · enrollment@continuumfs.com
            </span>
            <span className="text-slate-400">
              Demo environment — sample data only, no real email is sent.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
