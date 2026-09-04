import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ACTIONS = [
  {
    key: 'trace',
    label: 'Trace Order',
    to: '/trace-order',
    tone: 'brand',
    d: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
  },
  {
    key: 'search',
    label: 'Search Inventory',
    to: '/inventory',
    tone: 'brand',
    d: 'M20.25 7.5 12 3 3.75 7.5m16.5 0L12 12m8.25-4.5v9L12 21m0-9L3.75 7.5m8.25 4.5v9m0-9L3.75 12m0-4.5v9L12 21',
  },
  {
    key: 'inward',
    label: 'Stock Inward',
    to: '/admin?tab=stock&mode=inward',
    tone: 'good',
    d: 'M12 4.5v15m0 0 6-6m-6 6-6-6',
    adminOnly: true,
  },
  {
    key: 'outward',
    label: 'Stock Outward',
    to: '/admin?tab=stock&mode=outward',
    tone: 'warning',
    d: 'M12 19.5v-15m0 0-6 6m6-6 6 6',
    adminOnly: true,
  },
  {
    key: 'transfer',
    label: 'Transfer Stock',
    to: '/admin?tab=stock&mode=transfer',
    tone: 'brand',
    d: 'M16.5 3.75 21 8.25m0 0L16.5 12.75M21 8.25H3M7.5 20.25 3 15.75m0 0 4.5-4.5M3 15.75h18',
    adminOnly: true,
  },
];

const TONE_CLASSES = {
  brand: 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
  good: 'bg-status-good-bg text-status-good group-hover:bg-green-100',
  warning: 'bg-status-warning-bg text-status-warning group-hover:bg-amber-100',
};

export default function QuickActions() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const actions = ACTIONS.filter((action) => !action.adminOnly || isAdmin);

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick actions</h2>
      <div className={`grid gap-2 sm:gap-3 ${actions.length >= 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2'}`}>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => navigate(action.to)}
            className="group flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-1.5 py-3 text-center shadow-sm transition-colors hover:border-brand-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:bg-slate-50"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${TONE_CLASSES[action.tone]}`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={action.d} />
              </svg>
            </span>
            <span className="text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
