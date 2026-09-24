import { STATUS_STYLES, statusLabel } from "@/config/statuses";

export function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${style} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
