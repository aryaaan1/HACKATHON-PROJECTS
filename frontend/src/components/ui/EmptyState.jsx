export default function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}
