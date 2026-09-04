export default function FormBanner({ result }) {
  if (!result) return null;
  const isError = result.type === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
        isError
          ? 'border-status-critical-bg bg-status-critical-bg text-status-critical'
          : 'border-status-good-bg bg-status-good-bg text-status-good'
      }`}
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        {isError ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.007v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        )}
      </svg>
      <span>{result.message}</span>
    </div>
  );
}
