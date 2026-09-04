import { useEffect, useMemo, useState } from 'react';
import { getLocations } from '../api/locations';
import { useLowStock } from '../hooks/useLowStock';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { getRowStockStatus } from '../utils/status';

export default function Warehouse() {
  const [locations, setLocations] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const { index: lowStockIndex } = useLowStock();

  function load() {
    setLoading(true);
    setError(null);
    getLocations()
      .then((data) => {
        setLocations(data);
        setSelectedRow((prev) => prev ?? data[0]?.row_name ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const { warehouseName, rows, binsByRow } = useMemo(() => {
    if (!locations) return { warehouseName: null, rows: [], binsByRow: {} };

    const warehouseName = locations[0]?.warehouse_name ?? 'Warehouse';
    const rowSet = new Map(); // row_name -> total quantity
    const binsByRow = {}; // row_name -> { bin_code -> { products: [], quantity } }

    for (const loc of locations) {
      rowSet.set(loc.row_name, (rowSet.get(loc.row_name) || 0) + loc.quantity);
      binsByRow[loc.row_name] = binsByRow[loc.row_name] || {};
      const binMap = binsByRow[loc.row_name];
      binMap[loc.bin_location_code] = binMap[loc.bin_location_code] || { products: [], quantity: 0 };
      binMap[loc.bin_location_code].products.push({
        sku: loc.product_sku,
        name: loc.product_name,
        quantity: loc.quantity,
      });
      binMap[loc.bin_location_code].quantity += loc.quantity;
    }

    const rows = Array.from(rowSet.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { warehouseName, rows, binsByRow };
  }, [locations]);

  if (loading) return <LoadingState label="Loading warehouse layout..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!locations || rows.length === 0) {
    return <EmptyState title="No stocked locations yet" message="Bins will appear here once inventory is recorded." />;
  }

  const bins = Object.entries(binsByRow[selectedRow] || {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-4">
      <Card title={warehouseName} subtitle={`${rows.length} row${rows.length === 1 ? '' : 's'} with recorded stock`}>
        <div className="flex flex-wrap gap-2">
          {rows.map((row) => (
            <button
              key={row.name}
              onClick={() => setSelectedRow(row.name)}
              className={`flex flex-col items-start rounded-lg border px-4 py-2 text-left transition-colors ${
                selectedRow === row.name
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-slate-200 bg-white hover:border-brand-200'
              }`}
            >
              <span className={`text-sm font-semibold ${selectedRow === row.name ? 'text-brand-700' : 'text-slate-700'}`}>
                {row.name}
              </span>
              <span className="text-xs text-slate-400">{row.quantity.toLocaleString()} units</span>
            </button>
          ))}
        </div>
      </Card>

      <Card
        title={`Bins in ${selectedRow}`}
        subtitle="Only bins with recorded stock are returned by the API — empty bins aren't listed"
      >
        {bins.length === 0 ? (
          <EmptyState title="No bins with stock in this row" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bins.map(([binCode, info]) => {
              const worstStatus = info.products.reduce((worst, p) => {
                const s = getRowStockStatus(p.sku, binCode, p.quantity, lowStockIndex);
                const rank = { critical: 2, warning: 1, good: 0 };
                return rank[s.tone] > rank[worst.tone] ? s : worst;
              }, { tone: 'good', label: 'In stock' });

              return (
                <div key={binCode} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-slate-800">{binCode}</span>
                    <Badge tone={worstStatus.tone}>{worstStatus.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{info.quantity.toLocaleString()} units total</p>
                  <ul className="mt-3 space-y-1.5">
                    {info.products.map((p) => (
                      <li key={p.sku} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{p.name}</span>
                        <span className="font-medium text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {p.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
