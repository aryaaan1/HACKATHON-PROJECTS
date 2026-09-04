import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { NavIcon, mobileNavGroups } from './navItems';
import { useAuth } from '../../context/AuthContext';

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
  const navigate = useNavigate();
  const { isAdmin, username, role, logout } = useAuth();
  const { primary, overflow } = mobileNavGroups(isAdmin);
  const isOnOverflowPage = overflow.some((item) => pathname === item.to);

  function handleLogout() {
    setMoreOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

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
          {overflow.map((item) => (
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
          <div className="my-1 border-t border-slate-100" />
          <div className="px-3 py-2">
            <p className="truncate text-xs font-semibold text-slate-700">{username}</p>
            <p className="text-[11px] capitalize text-slate-400">{role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-status-critical hover:bg-status-critical-bg"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Log out
          </button>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-slate-200 bg-white/95 px-1 pt-1 pb-safe backdrop-blur md:hidden"
        aria-label="Primary"
      >
        {primary.map((item) => (
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
