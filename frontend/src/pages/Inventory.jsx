import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const STATUS_RANK = { critical: 2, warning: 1, good: 0 };

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
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

  function updateStatusFilter(key) {
    setStatusFilter(key);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === 'all') next.delete('status');
      else next.set('status', key);
      return next;
    }, { replace: true });
  }

  // Flatten product+location pairs into one row per bin — what the desktop
  // table needs, since a product can sit in multiple bins.
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

  // One card per product for the mobile view — a product's locations are
  // summarized (total qty, location count, main bin) instead of one row
  // per bin, since scanning a long per-bin table on a phone doesn't work.
  const productSummaries = useMemo(() => {
    return products.map((product) => {
      const totalQuantity = product.locations.reduce((sum, loc) => sum + loc.quantity, 0);
      const mainLocation = product.locations.reduce(
        (best, loc) => (!best || loc.quantity > best.quantity ? loc : best),
        null
      );
      const worstStatus = product.locations.reduce((worst, loc) => {
        const s = getRowStockStatus(product.sku, loc.bin_location, loc.quantity, lowStockIndex);
        return STATUS_RANK[s.tone] > STATUS_RANK[worst.tone] ? s : worst;
      }, { key: 'ok', tone: 'good', label: 'In stock' });

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        totalQuantity,
        locationCount: product.locations.length,
        mainLocation,
        status: worstStatus,
        rows: product.locations.map((loc) => loc.row),
      };
    });
  }, [products, lowStockIndex]);

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

  const filteredSummaries = useMemo(() => {
    return productSummaries.filter((p) => {
      if (statusFilter !== 'all' && p.status.key !== statusFilter) return false;
      if (rowFilter !== 'all' && !p.rows.includes(rowFilter)) return false;
      return true;
    });
  }, [productSummaries, statusFilter, rowFilter]);

  const isLoading = loading || lowStockLoading;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product name or SKU..."
            label="Search inventory"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rowFilter}
              onChange={(e) => setRowFilter(e.target.value)}
              aria-label="Filter by row"
              className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All rows</option>
              {rowNames.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex flex-1 min-w-[200px] flex-wrap overflow-hidden rounded-lg border border-slate-200">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => updateStatusFilter(f.key)}
                  className={`min-h-[40px] flex-1 px-3 py-2 text-xs font-medium transition-colors ${
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

      {isLoading ? (
        <Card><LoadingState label="Loading inventory..." /></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={() => load(search)} /></Card>
      ) : filteredRows.length === 0 ? (
        <Card><EmptyState title="No matching inventory" message="Try a different search or filter." /></Card>
      ) : (
        <>
          {/* Mobile: per-product cards */}
          <div className="space-y-3 md:hidden">
            {filteredSummaries.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                  </div>
                  <Badge tone={p.status.tone}>{p.status.label}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-base font-semibold text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {p.totalQuantity}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Total Qty</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-base font-semibold text-slate-800">{p.locationCount}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Locations</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="truncate px-1 font-mono text-sm font-semibold text-slate-800">
                      {p.mainLocation?.bin_location ?? '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Main Bin</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: full per-bin table */}
          <Card className="hidden md:block">
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
          </Card>
        </>
      )}
    </div>
  );
}
