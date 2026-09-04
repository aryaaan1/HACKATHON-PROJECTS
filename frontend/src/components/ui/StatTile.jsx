export default function StatTile({ label, value, icon, tone = 'brand' }) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-600',
    warning: 'bg-status-warning-bg text-status-warning',
    critical: 'bg-status-critical-bg text-status-critical',
    good: 'bg-status-good-bg text-status-good',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        {icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses[tone] || toneClasses.brand}`}>
            {icon}
          </span>
        )}
      </div>
      <p
        className="mt-3 text-3xl font-semibold text-slate-900"
        style={{ fontVariantNumeric: 'proportional-nums' }}
      >
        {value}
      </p>
    </div>
  );
}
