import { useEffect, useState } from 'react';
import { searchProducts } from '../../api/products';
import { createOrder } from '../../api/orders';
import FormField, { inputClass } from '../ui/FormField';
import FormBanner from './FormBanner';

export default function CreateOrderForm() {
  const [products, setProducts] = useState([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    searchProducts('').then(setProducts).catch(() => {});
  }, []);

  function updateItem(idx, field, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: '', quantity: '' }]);
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      await createOrder({
        order_number: orderNumber,
        items: items.map((it) => ({
          product_id: Number(it.productId),
          ordered_quantity: Number(it.quantity),
        })),
      });
      setResult({ type: 'success', message: 'Order created.' });
      setOrderNumber('');
      setItems([{ productId: '', quantity: '' }]);
    } catch (err) {
      setResult({ type: 'error', message: `${err.message} (this endpoint isn't implemented on the backend yet)` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Order Number">
          <input
            required
            className={inputClass}
            placeholder="e.g. ORD-006"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </FormField>

        <div className="space-y-3">
          <span className="block text-xs font-medium text-slate-600">Items</span>
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-lg border border-slate-100 p-2.5 sm:flex-row sm:items-end sm:border-0 sm:p-0">
              <div className="min-w-[180px] flex-1">
                <select
                  required
                  className={inputClass}
                  value={item.productId}
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                  aria-label={`Product for item ${idx + 1}`}
                >
                  <option value="" disabled>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="Qty"
                  aria-label={`Quantity for item ${idx + 1}`}
                  className={`${inputClass} w-24`}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    aria-label={`Remove item ${idx + 1}`}
                    className="min-h-[44px] shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="min-h-[40px] text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            + Add item
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-[48px] w-full rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 sm:w-auto"
        >
          {submitting ? 'Submitting...' : 'Create Order'}
        </button>
      </form>
      <FormBanner result={result} />
    </div>
  );
}
