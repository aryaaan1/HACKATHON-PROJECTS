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
            <div key={idx} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <select
                  required
                  className={inputClass}
                  value={item.productId}
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                >
                  <option value="" disabled>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <input
                required
                type="number"
                min="1"
                placeholder="Qty"
                className={`${inputClass} w-24`}
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            + Add item
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Create Order'}
        </button>
      </form>
      <FormBanner result={result} />
    </div>
  );
}
