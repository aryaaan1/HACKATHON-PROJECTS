import { useEffect, useState } from 'react';
import { searchProducts } from '../../api/products';
import { stockInward, stockOutward, stockTransfer } from '../../api/stock';
import FormField, { inputClass } from '../ui/FormField';
import FormBanner from './FormBanner';

const MODES = [
  { key: 'inward', label: 'Inward' },
  { key: 'outward', label: 'Outward' },
  { key: 'transfer', label: 'Transfer' },
];

export default function AdjustStockForm() {
  const [mode, setMode] = useState('inward');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', binId: '', toBinId: '', quantity: '', reference: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    searchProducts('').then(setProducts).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const base = {
        product_id: Number(form.productId),
        quantity: Number(form.quantity),
        reference: form.reference || undefined,
      };
      let response;
      if (mode === 'inward') {
        response = await stockInward({ ...base, bin_id: Number(form.binId) });
      } else if (mode === 'outward') {
        response = await stockOutward({ ...base, bin_id: Number(form.binId) });
      } else {
        response = await stockTransfer({
          ...base,
          from_bin_id: Number(form.binId),
          to_bin_id: Number(form.toBinId),
        });
      }
      setResult({ type: 'success', message: response.message || 'Stock updated successfully.' });
      setForm({ productId: '', binId: '', toBinId: '', quantity: '', reference: '' });
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex overflow-hidden rounded-lg border border-slate-200 w-fit">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMode(m.key); setResult(null); }}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              mode === m.key ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Product">
          <select
            required
            className={inputClass}
            value={form.productId}
            onChange={(e) => update('productId', e.target.value)}
          >
            <option value="" disabled>Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </FormField>

        <FormField label="Quantity">
          <input
            required
            type="number"
            min="1"
            className={inputClass}
            value={form.quantity}
            onChange={(e) => update('quantity', e.target.value)}
          />
        </FormField>

        <FormField
          label={mode === 'transfer' ? 'From Bin ID' : 'Bin ID'}
          hint="Numeric bin ID — the API doesn't yet expose a lookup from bin code to ID."
        >
          <input
            required
            type="number"
            min="1"
            className={inputClass}
            value={form.binId}
            onChange={(e) => update('binId', e.target.value)}
          />
        </FormField>

        {mode === 'transfer' && (
          <FormField label="To Bin ID">
            <input
              required
              type="number"
              min="1"
              className={inputClass}
              value={form.toBinId}
              onChange={(e) => update('toBinId', e.target.value)}
            />
          </FormField>
        )}

        <FormField label="Reference (optional)">
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. RECV-001"
            value={form.reference}
            onChange={(e) => update('reference', e.target.value)}
          />
        </FormField>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : `Submit ${MODES.find((m) => m.key === mode).label}`}
          </button>
        </div>
      </form>

      <FormBanner result={result} />
    </div>
  );
}
