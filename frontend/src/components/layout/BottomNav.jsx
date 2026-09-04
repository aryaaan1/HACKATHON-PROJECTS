import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavIcon, PRIMARY_MOBILE_NAV, OVERFLOW_MOBILE_NAV } from './navItems';

function NavButton({ to, end, icon, label }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
          isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <NavIcon name={icon} className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const isOnOverflowPage = OVERFLOW_MOBILE_NAV.some((item) => pathname === item.to);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {moreOpen && (
        <div className="fixed inset-x-0 bottom-16 z-50 mx-3 rounded-xl border border-slate-200 bg-white p-2 shadow-lg pb-safe md:hidden">
          {OVERFLOW_MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-slate-200 bg-white/95 px-1 pt-1 pb-safe backdrop-blur md:hidden"
        aria-label="Primary"
      >
        {PRIMARY_MOBILE_NAV.map((item) => (
          <NavButton key={item.to} to={item.to} end={item.end} icon={item.icon} label={item.shortLabel || item.label} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label="More navigation options"
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
            moreOpen || isOnOverflowPage ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <NavIcon name="dots" className={`h-5 w-5 ${moreOpen || isOnOverflowPage ? 'text-brand-600' : 'text-slate-400'}`} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
