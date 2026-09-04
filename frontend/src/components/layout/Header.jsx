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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        {statusLabel}
      </div>
    </header>
  );
}
