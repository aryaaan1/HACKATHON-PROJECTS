import { useLocation } from 'react-router-dom';
import { useBackendStatus } from '../../hooks/useBackendStatus';

const TITLES = {
  '/': ['Dashboard', 'Live overview of stock across the warehouse'],
  '/trace-order': ['Trace Order', 'Find exact pick locations for any order'],
  '/inventory': ['Inventory', 'Search and audit stock levels'],
  '/warehouse': ['Warehouse', 'Rows and bins at a glance'],
  '/movements': ['Stock Movements', 'Full audit trail of inward, outward and transfers'],
  '/admin': ['Admin', 'Manage products, locations, stock and orders'],
};

export default function Header() {
  const { pathname } = useLocation();
  const [title, subtitle] = TITLES[pathname] || ['Warehouse OS', ''];
  const online = useBackendStatus();

  const statusLabel = online === null ? 'Checking...' : online ? 'Backend online' : 'Backend unreachable';
  const dotClass = online === null ? 'bg-slate-300' : online ? 'bg-status-good' : 'bg-status-critical';

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white pt-safe">
      {/* Mobile: compact sticky bar */}
      <div className="flex h-14 items-center gap-2 px-3 md:hidden">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
          W
        </div>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">{title}</h1>
        <span
          className="flex shrink-0 items-center justify-center rounded-full bg-slate-100 p-1.5"
          role="img"
          aria-label={statusLabel}
          title={statusLabel}
        >
          {online === false ? (
            <svg className="h-3.5 w-3.5 text-status-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.007v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : (
            <span className={`block h-2.5 w-2.5 rounded-full ${dotClass}`} />
          )}
        </span>
      </div>

      {/* Desktop: spacious header */}
      <div className="hidden h-16 items-center justify-between px-6 md:flex">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          {statusLabel}
        </div>
      </div>
    </header>
  );
}
