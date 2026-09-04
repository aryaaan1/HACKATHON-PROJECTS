import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, NavIcon } from './navItems';

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          W
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">Warehouse OS</p>
          <p className="text-[11px] text-slate-400 leading-tight">Inventory Control</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <NavIcon name={item.icon} className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4 text-[11px] text-slate-400">
        Main Warehouse
      </div>
    </aside>
  );
}
