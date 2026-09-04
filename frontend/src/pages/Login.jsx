import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField, { inputClass } from '../components/ui/FormField';

const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'Admin@123' },
  { label: 'Employee', username: 'employee', password: 'Employee@123' },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      const dest = location.state?.from || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account) {
    setUsername(account.username);
    setPassword(account.password);
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">
            W
          </div>
          <p className="text-base font-semibold text-slate-800">Warehouse OS</p>
          <p className="text-xs text-slate-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-4">
            <FormField label="Username">
              <input
                type="text"
                autoComplete="username"
                autoFocus
                required
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormField>
            <FormField label="Password">
              <input
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-status-critical-bg bg-status-critical-bg px-3 py-2.5 text-sm text-status-critical">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="mt-5 min-h-[48px] w-full rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="mb-2 font-semibold uppercase tracking-wide text-slate-400">Demo accounts</p>
          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => fillDemo(account)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
              >
                <span className="font-medium text-slate-600">{account.label}</span>
                <span className="font-mono text-slate-400">{account.username} / {account.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
