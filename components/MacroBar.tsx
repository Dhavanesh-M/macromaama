export default function MacroBar({
  label,
  consumed,
  target,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
}) {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-bold text-stone-700">{label}</span>
        <span className="tabular-nums text-stone-500">
          <strong className="text-stone-800">{Math.round(consumed)}g</strong> / {Math.round(target)}g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${color}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
