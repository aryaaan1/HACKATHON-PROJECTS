import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-status-critical-bg bg-status-critical-bg px-6 py-16 text-center">
      <svg className="h-10 w-10 text-status-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.502-3.032-1.502-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <p className="text-base font-semibold text-status-critical">Access denied</p>
      <p className="max-w-sm text-sm text-status-critical/80">
        Your account doesn't have permission to view this page. Admin controls are restricted to Admin accounts.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-status-critical shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-critical"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
