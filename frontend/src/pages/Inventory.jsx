import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchProducts } from '../api/products';
import { useLowStock } from '../hooks/useLowStock';
import SearchInput from '../components/ui/SearchInput';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { getRowStockStatus } from '../utils/status';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ok', label: 'In stock' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
];

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rowFilter, setRowFilter] = useState('all');
  const { index: lowStockIndex, loading: lowStockLoading } = useLowStock();

  const load = useCallback((term) => {
    setLoading(true);
    setError(null);
    searchProducts(term)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => load(search), 250);
    return () => clearTimeout(handle);
  }, [search, load]);

  // Flatten product+location pairs into one row per bin, since a product can
  // sit in multiple bins and that's what the table needs to show.
  const rows = useMemo(() => {
    const flattened = [];
    for (const product of products) {
      for (const loc of product.locations) {
        flattened.push({
          key: `${product.id}-${loc.bin_location}`,
          productName: product.name,
          sku: product.sku,
          warehouse: loc.warehouse,
          row: loc.row,
          bin: loc.bin_location,
          quantity: loc.quantity,
        });
      }
    }
    return flattened;
  }, [products]);

  const rowNames = useMemo(
    () => Array.from(new Set(rows.map((r) => r.row))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const status = getRowStockStatus(r.sku, r.bin, r.quantity, lowStockIndex);
      if (statusFilter !== 'all' && status.key !== statusFilter) return false;
      if (rowFilter !== 'all' && r.row !== rowFilter) return false;
      return true;
    });
  }, [rows, statusFilter, rowFilter, lowStockIndex]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product name or SKU..."
            className="sm:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rowFilter}
              onChange={(e) => setRowFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All rows</option>
              {rowNames.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex overflow-hidden rounded-lg border border-slate-200">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    statusFilter === f.key
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        {loading || lowStockLoading ? (
          <LoadingState label="Loading inventory..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(search)} />
        ) : filteredRows.length === 0 ? (
          <EmptyState title="No matching inventory" message="Try a different search or filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Product</th>
                  <th className="pb-2 pr-4 font-medium">SKU</th>
                  <th className="pb-2 pr-4 font-medium">Location</th>
                  <th className="pb-2 pr-4 font-medium">Row</th>
                  <th className="pb-2 pr-4 font-medium">Bin</th>
                  <th className="pb-2 pr-4 font-medium">Quantity</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.map((r) => {
                  const status = getRowStockStatus(r.sku, r.bin, r.quantity, lowStockIndex);
                  return (
                    <tr key={r.key}>
                      <td className="py-2.5 pr-4 font-medium text-slate-700">{r.productName}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{r.sku}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{r.warehouse} / {r.row} / {r.bin}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{r.row}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{r.bin}</td>
                      <td className="py-2.5 pr-4 text-slate-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {r.quantity}
                      </td>
                      <td className="py-2.5">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
