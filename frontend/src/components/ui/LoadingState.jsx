export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-slate-500 sm:py-16">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
