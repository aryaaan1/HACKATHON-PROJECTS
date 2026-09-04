// Single source of truth for primary navigation, shared by the desktop
// Sidebar, the mobile bottom nav, and the mobile "More" menu.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/trace-order', label: 'Trace Order', shortLabel: 'Orders', icon: 'search' },
  { to: '/inventory', label: 'Inventory', icon: 'box' },
  { to: '/warehouse', label: 'Warehouse', icon: 'building' },
  { to: '/movements', label: 'Stock Movements', shortLabel: 'Movements', icon: 'swap' },
  { to: '/admin', label: 'Admin', icon: 'settings' },
];

// The bottom nav only has room for ~4 destinations plus a "More" overflow.
export const PRIMARY_MOBILE_NAV = NAV_ITEMS.slice(0, 4);
export const OVERFLOW_MOBILE_NAV = NAV_ITEMS.slice(4);

export const NAV_ICON_PATHS = {
  grid: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  search: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
  box: 'M20.25 7.5 12 3 3.75 7.5m16.5 0L12 12m8.25-4.5v9L12 21m0-9L3.75 7.5m8.25 4.5v9m0-9L3.75 12m0-4.5v9L12 21',
  building: 'M3.75 21h16.5M4.5 3.75h9v16.5h-9V3.75Zm9 6h6v10.5h-6M8.25 6.75h.008v.008H8.25V6.75Zm0 3h.008v.008H8.25V9.75Zm0 3h.008v.008H8.25v-.008Z',
  swap: 'M16.5 3.75 21 8.25m0 0L16.5 12.75M21 8.25H3M7.5 20.25 3 15.75m0 0 4.5-4.5M3 15.75h18',
  settings: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.775 7.775 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z',
  dots: 'M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z',
  close: 'M6 18 18 6M6 6l12 12',
};

export function NavIcon({ name, className = 'h-5 w-5' }) {
  const d = NAV_ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}
