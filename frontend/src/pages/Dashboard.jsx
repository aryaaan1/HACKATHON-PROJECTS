import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard';
import StatTile from '../components/ui/StatTile';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BarRow from '../components/ui/BarRow';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useProductLookup } from '../hooks/useProductLookup';
import { MOVEMENT_TYPES, formatDateTime } from '../utils/status';

function Icon({ d }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total SKUs" value={data.total_products.toLocaleString()} icon={ICONS.products} tone="brand" />
        <StatTile label="Total Stock Qty" value={data.total_stock.toLocaleString()} icon={ICONS.stack} tone="brand" />
        <StatTile label="Low-Stock Items" value={data.low_stock_items.toLocaleString()} icon={ICONS.warning} tone="warning" />
        <StatTile label="Warehouse Rows" value={data.total_rows.toLocaleString()} icon={ICONS.rows} tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card title="Stock Overview by Row" subtitle="Total quantity held in each row" className="lg:col-span-2">
          {data.stock_by_row.length === 0 ? (
            <EmptyState title="No stock recorded yet" />
          ) : (
            <div className="space-y-4">
              {data.stock_by_row.map((row) => (
                <BarRow key={row.row_name} label={row.row_name} value={row.quantity} maxValue={maxRowQty} />
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent Stock Movements" subtitle="Latest 10 inventory changes" className="lg:col-span-3">
          {data.recent_movements.length === 0 ? (
            <EmptyState title="No movements recorded yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4 font-medium">Product</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Qty</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recent_movements.map((m) => {
                    const type = MOVEMENT_TYPES[m.movement_type] || { label: m.movement_type, tone: 'neutral' };
                    const product = lookup[m.product_id];
                    return (
                      <tr key={m.id}>
                        <td className="py-2 pr-4 font-medium text-slate-700">
                          {product ? `${product.name} (${product.sku})` : `Product #${m.product_id}`}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge tone={type.tone}>{type.label}</Badge>
                        </td>
                        <td className="py-2 pr-4 text-slate-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {m.quantity}
                        </td>
                        <td className="py-2 text-slate-400">{formatDateTime(m.timestamp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
