import { useState } from 'react';
import { getOrder } from '../api/orders';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
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

function FlowStep({ label, value, emphasis }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        <span className={`h-2.5 w-2.5 rounded-full ${emphasis ? 'bg-brand-500' : 'bg-slate-300'}`} />
        <span className="mt-1 h-6 w-px bg-slate-200 last:hidden" />
      </div>
      <div className="min-w-0 flex-1 pb-4 last:pb-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={emphasis ? 'text-2xl font-bold tracking-tight text-brand-700' : 'truncate text-sm font-semibold text-slate-700'}>
          {value}
        </p>
      </div>
    </div>
  );
}

function OrderItemCard({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const insufficient = item.location && item.location.available_quantity < item.ordered_quantity;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{item.product_name}</p>
          <p className="text-xs text-slate-400">SKU: {item.product_sku} · Qty {item.ordered_quantity}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {item.location ? (
            <Badge tone={insufficient ? 'critical' : 'good'}>{item.location.bin}</Badge>
          ) : (
            <Badge tone="critical">No location</Badge>
          )}
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          {item.location ? (
            <>
              <FlowStep label="Product" value={`${item.product_name} (${item.product_sku})`} />
              <FlowStep label="Warehouse" value={item.location.warehouse} />
              <FlowStep label="Row" value={item.location.row} />
              <FlowStep label="Bin" value={item.location.bin} emphasis />
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <span className={`h-2.5 w-2.5 rounded-full ${insufficient ? 'bg-status-critical' : 'bg-status-good'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Quantity</p>
                  <p className="text-sm font-semibold text-slate-700">
                    Ordered <span className="font-bold">{item.ordered_quantity}</span> · Available{' '}
                    <span className={insufficient ? 'font-bold text-status-critical' : 'font-bold text-status-good'}>
                      {item.location.available_quantity}
                    </span>
                  </p>
                </div>
              </div>
              {insufficient && (
                <p className="mt-3 rounded-lg bg-status-critical-bg px-3 py-2 text-xs font-medium text-status-critical">
                  Insufficient stock at this bin for the ordered quantity.
                </p>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-status-critical-bg bg-status-critical-bg p-3 text-sm text-status-critical">
              No stock location found for this product.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="order-number-input" className="text-xs font-medium text-slate-600">
            Order number
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="order-number-input"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. ORD-001"
              inputMode="text"
              autoCapitalize="characters"
              className="min-h-[52px] w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:flex-1"
            />
            <button
              type="submit"
              className="min-h-[52px] shrink-0 rounded-lg bg-brand-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
              disabled={!term.trim()}
            >
              Trace Order
            </button>
          </div>
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {order.items.map((item, idx) => (
                <OrderItemCard key={idx} item={item} defaultOpen={order.items.length <= 2 || idx === 0} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
