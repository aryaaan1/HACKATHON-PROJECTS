export default function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center sm:py-16">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}
