const TONE_CLASSES = {
  good: 'bg-status-good-bg text-status-good',
  warning: 'bg-status-warning-bg text-status-warning',
  critical: 'bg-status-critical-bg text-status-critical',
  series: 'bg-brand-50 text-brand-700',
  neutral: 'bg-slate-100 text-slate-600',
};

const TONE_DOT = {
  good: 'bg-status-good',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
  series: 'bg-brand-500',
  neutral: 'bg-slate-400',
};

export default function Badge({ tone = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone] || TONE_DOT.neutral}`} />
      {children}
    </span>
  );
}
