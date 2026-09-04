import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import StatTile from '../components/ui/StatTile';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BarRow from '../components/ui/BarRow';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import QuickActions from '../components/dashboard/QuickActions';
import { useProductLookup } from '../hooks/useProductLookup';
import { useBackendStatus } from '../hooks/useBackendStatus';
import { MOVEMENT_TYPES, formatDateTime, formatRelativeTime } from '../utils/status';

function Icon({ d }) {
  return (
    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

const ICONS = {
  products: <Icon d="M20.25 7.5 12 3 3.75 7.5m16.5 0L12 12m8.25-4.5v9L12 21m0-9L3.75 7.5m8.25 4.5v9m0-9L3.75 12m0-4.5v9L12 21" />,
  stack: <Icon d="M21 7.5 12 3 3 7.5m18 0-9 4.5m9-4.5v9L12 21m0-9L3 7.5m9 4.5v9M3 7.5v9L12 21" />,
  warning: <Icon d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.502-3.032-1.502-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />,
  rows: <Icon d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />,
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lookup } = useProductLookup();
  const online = useBackendStatus();
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const maxRowQty = Math.max(1, ...data.stock_by_row.map((r) => r.quantity));
  const hasLowStock = data.low_stock_items > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Backend status — only surfaced here when it needs attention; the
          header already shows it persistently. */}
      {online === false && (
        <div className="flex items-center gap-3 rounded-xl border border-status-critical-bg bg-status-critical-bg px-4 py-3 text-sm font-medium text-status-critical">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.007v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Backend unreachable — figures below may be out of date.
        </div>
      )}

      {/* 2. Critical / low-stock callout */}
      {hasLowStock && (
        <button
          type="button"
          onClick={() => navigate('/inventory?status=low')}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-status-warning-bg bg-status-warning-bg px-4 py-3 text-left transition-colors hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-warning"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/60 text-status-warning">
              {ICONS.warning}
            </span>
            <div>
              <p className="text-sm font-semibold text-status-warning">
                {data.low_stock_items} item{data.low_stock_items === 1 ? '' : 's'} low on stock
              </p>
              <p className="text-xs text-status-warning/80">Tap to review in Inventory</p>
            </div>
          </div>
          <svg className="h-5 w-5 shrink-0 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* 3. Quick actions */}
      <QuickActions />

      {/* 4. KPI summary — compact 2-col grid on mobile, spacious 4-col on desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total SKUs" value={data.total_products.toLocaleString()} icon={ICONS.products} tone="brand" />
        <StatTile label="Total Stock Qty" value={data.total_stock.toLocaleString()} icon={ICONS.stack} tone="brand" />
        <StatTile
          label="Low-Stock Items"
          value={data.low_stock_items.toLocaleString()}
          icon={ICONS.warning}
          tone="warning"
          onClick={() => navigate('/inventory?status=low')}
          hint="View in Inventory"
        />
        <StatTile
          label="Warehouse Rows"
          value={data.total_rows.toLocaleString()}
          icon={ICONS.rows}
          tone="good"
          onClick={() => navigate('/warehouse')}
          hint="View Warehouse"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        {/* 5. Stock by row */}
        <Card title="Stock Overview by Row" subtitle="Total quantity held in each row" className="lg:col-span-2">
          {data.stock_by_row.length === 0 ? (
            <EmptyState title="No stock recorded yet" />
          ) : (
            <div className="space-y-4 overflow-hidden">
              {data.stock_by_row.map((row) => (
                <BarRow key={row.row_name} label={row.row_name} value={row.quantity} maxValue={maxRowQty} />
              ))}
            </div>
          )}
        </Card>

        {/* 6. Recent stock movements, as an activity feed */}
        <Card title="Recent Activity" subtitle="Latest 10 inventory changes" className="lg:col-span-3">
          {data.recent_movements.length === 0 ? (
            <EmptyState title="No movements recorded yet" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {data.recent_movements.map((m) => {
                const type = MOVEMENT_TYPES[m.movement_type] || { label: m.movement_type, tone: 'neutral' };
                const product = lookup[m.product_id];
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${type.iconBg || 'bg-slate-100'}`}>
                      {type.glyph || '•'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {product ? `${product.name} (${product.sku})` : `Product #${m.product_id}`}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <Badge tone={type.tone}>{type.label}</Badge>
                        <span>{m.quantity} units</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-right text-xs text-slate-400" title={formatDateTime(m.timestamp)}>
                      {formatRelativeTime(m.timestamp)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
