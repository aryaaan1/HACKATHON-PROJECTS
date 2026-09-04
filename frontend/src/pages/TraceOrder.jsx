import { useState } from 'react';
import { getOrder } from '../api/orders';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SearchInput from '../components/ui/SearchInput';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { formatDateTime } from '../utils/status';

const STATUS_TONE = {
  pending: 'warning',
  processing: 'series',
  shipped: 'good',
  delivered: 'good',
};

export default function TraceOrder() {
  const [term, setTerm] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const orderNumber = term.trim();
    if (!orderNumber) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    getOrder(orderNumber)
      .then((data) => setOrder(data))
      .catch((err) => {
        setOrder(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={term}
            onChange={setTerm}
            placeholder="Enter order number, e.g. ORD-001"
            className="flex-1"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            disabled={!term.trim()}
          >
            Trace Order
          </button>
        </form>
      </Card>

      {loading && <LoadingState label="Looking up order..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !searched && (
        <EmptyState
          title="Trace an order"
          message="Enter an order number above to see exactly where to pick each item from."
        />
      )}

      {!loading && !error && order && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Order</p>
                <p className="text-lg font-semibold text-slate-800">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Placed</p>
                <p className="text-sm text-slate-600">{formatDateTime(order.created_at)}</p>
              </div>
              <Badge tone={STATUS_TONE[order.status] || 'neutral'}>{order.status}</Badge>
            </div>
          </Card>

          {order.items.length === 0 ? (
            <EmptyState title="No items on this order" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {order.items.map((item, idx) => (
                <Card key={idx}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{item.product_name}</p>
                      <p className="text-xs text-slate-400">SKU: {item.product_sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Ordered</p>
                      <p className="text-lg font-semibold text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {item.ordered_quantity}
                      </p>
                    </div>
                  </div>

                  {item.location ? (
                    <div className="mt-4 rounded-lg border-2 border-brand-500 bg-brand-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                        Pick from
                      </p>
                      <p className="mt-1 text-3xl font-bold tracking-tight text-brand-700">
                        {item.location.bin}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span><span className="font-medium text-slate-600">Warehouse:</span> {item.location.warehouse}</span>
                        <span><span className="font-medium text-slate-600">Row:</span> {item.location.row}</span>
                        <span><span className="font-medium text-slate-600">Bin:</span> {item.location.bin}</span>
                        <span>
                          <span className="font-medium text-slate-600">Available:</span>{' '}
                          <span className={item.location.available_quantity < item.ordered_quantity ? 'font-semibold text-status-critical' : ''}>
                            {item.location.available_quantity}
                          </span>
                        </span>
                      </div>
                      {item.location.available_quantity < item.ordered_quantity && (
                        <p className="mt-2 text-xs font-medium text-status-critical">
                          Insufficient stock at this bin for the ordered quantity.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-status-critical-bg bg-status-critical-bg p-3 text-sm text-status-critical">
                      No stock location found for this product.
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
