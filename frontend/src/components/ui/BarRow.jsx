// A single labeled magnitude bar. Sequential single-hue encoding per row.
export default function BarRow({ label, value, maxValue, suffix = '' }) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <div className="h-2.5 flex-1 rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className="w-16 shrink-0 text-right text-xs font-semibold text-slate-700"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value.toLocaleString()}{suffix}
      </span>
    </div>
  );
}
