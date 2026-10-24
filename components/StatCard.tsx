import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
      <span className="mb-4 grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon size={17} />
      </span>
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-stone-400">{detail}</p>
    </div>
  );
}
