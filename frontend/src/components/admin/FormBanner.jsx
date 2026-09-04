export default function FormBanner({ result }) {
  if (!result) return null;
  const isError = result.type === 'error';
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
        isError
          ? 'border-status-critical-bg bg-status-critical-bg text-status-critical'
          : 'border-status-good-bg bg-status-good-bg text-status-good'
      }`}
    >
      {result.message}
    </div>
  );
}
