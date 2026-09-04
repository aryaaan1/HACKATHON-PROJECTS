export default function StatTile({ label, value, icon, tone = 'brand', onClick, hint }) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-600',
    warning: 'bg-status-warning-bg text-status-warning',
    critical: 'bg-status-critical-bg text-status-critical',
    good: 'bg-status-good-bg text-status-good',
  };

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors sm:p-5 ${
        onClick ? 'cursor-pointer hover:border-brand-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:bg-slate-50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
          {label}
        </span>
        {icon && (
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${toneClasses[tone] || toneClasses.brand}`}>
            {icon}
          </span>
        )}
      </div>
      <p
        className="mt-1.5 text-xl font-semibold text-slate-900 sm:mt-3 sm:text-3xl"
        style={{ fontVariantNumeric: 'proportional-nums' }}
      >
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-[11px] text-slate-400 sm:text-xs">{hint}</p>}
    </Wrapper>
  );
}
