export default function MacroRing({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  return (
    <div className="relative grid size-44 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e7eee9" strokeWidth="11" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-extrabold tracking-tight tabular-nums">
          {Math.max(0, Math.round(target - consumed)).toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs font-medium text-stone-500">kcal left</p>
        <p className="mt-2 text-[11px] text-stone-400">
          {Math.round(consumed).toLocaleString()} / {Math.round(target).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
