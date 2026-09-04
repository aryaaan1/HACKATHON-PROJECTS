import { useEffect, useMemo, useState } from 'react';
import { getLocations } from '../api/locations';
import { useLowStock } from '../hooks/useLowStock';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { getRowStockStatus } from '../utils/status';

const STATUS_RANK = { critical: 2, warning: 1, good: 0 };

function Chevron({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function Warehouse() {
  const [locations, setLocations] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openRows, setOpenRows] = useState(new Set());
  const { index: lowStockIndex } = useLowStock();

  function load() {
    setLoading(true);
    setError(null);
    getLocations()
      .then((data) => {
        setLocations(data);
        const firstRow = data[0]?.row_name;
        setOpenRows((prev) => (prev.size > 0 || !firstRow ? prev : new Set([firstRow])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function toggleRow(rowName) {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowName)) next.delete(rowName);
      else next.add(rowName);
      return next;
    });
  }

  const { warehouseName, rows, binsByRow } = useMemo(() => {
    if (!locations) return { warehouseName: null, rows: [], binsByRow: {} };

    const warehouseName = locations[0]?.warehouse_name ?? 'Warehouse';
    const rowMap = new Map(); // row_name -> total quantity
    const binsByRow = {}; // row_name -> { bin_code -> { products: [], quantity } }

    for (const loc of locations) {
      rowMap.set(loc.row_name, (rowMap.get(loc.row_name) || 0) + loc.quantity);
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

    const rows = Array.from(rowMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { warehouseName, rows, binsByRow };
  }, [locations]);

  if (loading) return <LoadingState label="Loading warehouse layout..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!locations || rows.length === 0) {
    return <EmptyState title="No stocked locations yet" message="Bins will appear here once inventory is recorded." />;
  }

  return (
    <div className="space-y-4">
      <Card
        title={warehouseName}
        subtitle={`${rows.length} row${rows.length === 1 ? '' : 's'} with recorded stock — tap a row to expand`}
      >
        <div className="-mx-4 divide-y divide-slate-100 sm:-mx-5">
          {rows.map((row) => {
            const isOpen = openRows.has(row.name);
            const bins = Object.entries(binsByRow[row.name] || {}).sort(([a], [b]) => a.localeCompare(b));
            const rowWorstStatus = bins.reduce((worst, [binCode, info]) => {
              const binWorst = info.products.reduce((w, p) => {
                const s = getRowStockStatus(p.sku, binCode, p.quantity, lowStockIndex);
                return STATUS_RANK[s.tone] > STATUS_RANK[w.tone] ? s : w;
              }, { tone: 'good', label: 'In stock' });
              return STATUS_RANK[binWorst.tone] > STATUS_RANK[worst.tone] ? binWorst : worst;
            }, { tone: 'good', label: 'In stock' });

            return (
              <div key={row.name}>
                <button
                  type="button"
                  onClick={() => toggleRow(row.name)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Chevron open={isOpen} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-400">{row.quantity.toLocaleString()} units · {bins.length} bin{bins.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  {rowWorstStatus.tone !== 'good' && (
                    <Badge tone={rowWorstStatus.tone}>{rowWorstStatus.label}</Badge>
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5">
                    {bins.length === 0 ? (
                      <EmptyState title="No bins with stock in this row" />
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {bins.map(([binCode, info]) => {
                          const worstStatus = info.products.reduce((worst, p) => {
                            const s = getRowStockStatus(p.sku, binCode, p.quantity, lowStockIndex);
                            return STATUS_RANK[s.tone] > STATUS_RANK[worst.tone] ? s : worst;
                          }, { tone: 'good', label: 'In stock' });

                          return (
                            <div key={binCode} className="rounded-lg border border-slate-200 p-3.5">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm font-semibold text-slate-800">{binCode}</span>
                                <Badge tone={worstStatus.tone}>{worstStatus.label}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">{info.quantity.toLocaleString()} units total</p>
                              <ul className="mt-3 space-y-1.5">
                                {info.products.map((p) => (
                                  <li key={p.sku} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate text-slate-600">{p.name}</span>
                                    <span className="shrink-0 font-medium text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
