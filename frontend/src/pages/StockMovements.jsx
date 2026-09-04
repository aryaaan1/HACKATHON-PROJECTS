import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMovements } from '../api/stock';
import { useProductLookup } from '../hooks/useProductLookup';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SearchInput from '../components/ui/SearchInput';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { MOVEMENT_TYPES, formatDateTime } from '../utils/status';

const TYPE_FILTERS = ['all', 'INWARD', 'OUTWARD', 'TRANSFER'];

function BinRef({ id }) {
  if (id === null || id === undefined) return <span className="text-slate-300">—</span>;
  return <span className="font-mono text-xs text-slate-500">Bin #{id}</span>;
}

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { lookup } = useProductLookup();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMovements()
      .then(setMovements)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movements.filter((m) => {
      if (typeFilter !== 'all' && m.movement_type !== typeFilter) return false;
      if (!term) return true;
      const product = lookup[m.product_id];
      const haystack = `${product?.name || ''} ${product?.sku || ''} ${m.reference || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [movements, typeFilter, search, lookup]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product, SKU or reference..."
            label="Search movements"
          />
          <div className="flex overflow-x-auto rounded-lg border border-slate-200">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`min-h-[40px] flex-1 whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors ${
                  typeFilter === t ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t === 'all' ? 'All' : MOVEMENT_TYPES[t]?.label || t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card><LoadingState label="Loading stock movements..." /></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No movements found" message="Try a different filter or search term." /></Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2.5 md:hidden">
            {filtered.map((m) => {
              const type = MOVEMENT_TYPES[m.movement_type] || { label: m.movement_type, tone: 'neutral', glyph: '•', iconBg: 'bg-slate-100' };
              const product = lookup[m.product_id];
              return (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-semibold ${type.iconBg}`}>
                      {type.glyph}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {product ? product.name : `Product #${m.product_id}`}
                        </p>
                        <Badge tone={type.tone}>{type.label}</Badge>
                      </div>
                      {product && <p className="text-xs text-slate-400">SKU: {product.sku}</p>}
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span><span className="text-slate-400">Qty:</span> <span className="font-semibold text-slate-700">{m.quantity}</span></span>
                        <span><span className="text-slate-400">When:</span> {formatDateTime(m.timestamp)}</span>
                        <span><span className="text-slate-400">From:</span> <BinRef id={m.from_bin_id} /></span>
                        <span><span className="text-slate-400">To:</span> <BinRef id={m.to_bin_id} /></span>
                      </div>
                      {m.reference && <p className="mt-1 text-xs text-slate-400">Ref: {m.reference}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4 font-medium">Product</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Qty</th>
                    <th className="pb-2 pr-4 font-medium">From</th>
                    <th className="pb-2 pr-4 font-medium">To</th>
                    <th className="pb-2 pr-4 font-medium">Reference</th>
                    <th className="pb-2 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((m) => {
                    const type = MOVEMENT_TYPES[m.movement_type] || { label: m.movement_type, tone: 'neutral', glyph: '•', iconBg: 'bg-slate-100' };
                    const product = lookup[m.product_id];
                    return (
                      <tr key={m.id}>
                        <td className="py-2.5 pr-4 font-medium text-slate-700">
                          {product ? `${product.name} (${product.sku})` : `Product #${m.product_id}`}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${type.iconBg}`}>{type.glyph}</span>
                            <Badge tone={type.tone}>{type.label}</Badge>
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {m.quantity}
                        </td>
                        <td className="py-2.5 pr-4"><BinRef id={m.from_bin_id} /></td>
                        <td className="py-2.5 pr-4"><BinRef id={m.to_bin_id} /></td>
                        <td className="py-2.5 pr-4 text-slate-400">{m.reference || '—'}</td>
                        <td className="py-2.5 text-slate-400">{formatDateTime(m.timestamp)}</td>
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
