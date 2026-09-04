import { useEffect, useState } from 'react';
import { searchProducts } from '../../api/products';
import { stockInward, stockOutward, stockTransfer } from '../../api/stock';
import FormField, { inputClass } from '../ui/FormField';
import ConfirmDialog from '../ui/ConfirmDialog';
import FormBanner from './FormBanner';

const MODES = [
  { key: 'inward', label: 'Inward' },
  { key: 'outward', label: 'Outward' },
  { key: 'transfer', label: 'Transfer' },
];

const VALID_MODES = new Set(MODES.map((m) => m.key));

export default function AdjustStockForm({ initialMode }) {
  const [mode, setMode] = useState(VALID_MODES.has(initialMode) ? initialMode : 'inward');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', binId: '', toBinId: '', quantity: '', reference: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    searchProducts('').then(setProducts).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const errors = {};
    if (!form.productId) errors.productId = 'Select a product.';
    if (!form.quantity || Number(form.quantity) <= 0) errors.quantity = 'Enter a quantity greater than 0.';
    if (!form.binId) errors.binId = mode === 'transfer' ? 'Select a source bin.' : 'Select a bin.';
    if (mode === 'transfer') {
      if (!form.toBinId) errors.toBinId = 'Select a destination bin.';
      else if (form.toBinId === form.binId) errors.toBinId = 'Destination bin must differ from the source bin.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function performSubmit() {
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    // Outward and transfer reduce/move stock out of a bin — confirm first.
    // Inward only adds stock, so it's safe to run immediately.
    if (mode === 'outward' || mode === 'transfer') {
      setConfirmOpen(true);
      return;
    }
    performSubmit();
  }

  const selectedProduct = products.find((p) => String(p.id) === String(form.productId));

  return (
    <div>
      <div className="mb-4 flex overflow-hidden rounded-lg border border-slate-200">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMode(m.key); setResult(null); setFieldErrors({}); }}
            className={`min-h-[40px] flex-1 px-4 py-2 text-xs font-medium transition-colors sm:flex-none ${
              mode === m.key ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Product" error={fieldErrors.productId}>
          <select
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

        <FormField label="Quantity" error={fieldErrors.quantity}>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            className={inputClass}
            value={form.quantity}
            onChange={(e) => update('quantity', e.target.value)}
          />
        </FormField>

        <FormField
          label={mode === 'transfer' ? 'From Bin ID' : 'Bin ID'}
          hint="Numeric bin ID — the API doesn't yet expose a lookup from bin code to ID."
          error={fieldErrors.binId}
        >
          <input
            type="number"
            inputMode="numeric"
            min="1"
            className={inputClass}
            value={form.binId}
            onChange={(e) => update('binId', e.target.value)}
          />
        </FormField>

        {mode === 'transfer' && (
          <FormField label="To Bin ID" error={fieldErrors.toBinId}>
            <input
              type="number"
              inputMode="numeric"
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
            className="min-h-[48px] w-full rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 sm:w-auto"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Submitting...
              </span>
            ) : (
              `Submit ${MODES.find((m) => m.key === mode).label}`
            )}
          </button>
        </div>
      </form>

      <FormBanner result={result} />

      <ConfirmDialog
        open={confirmOpen}
        title={mode === 'outward' ? 'Confirm stock outward' : 'Confirm stock transfer'}
        message={
          mode === 'outward'
            ? `Remove ${form.quantity || 0} unit(s) of ${selectedProduct ? selectedProduct.name : 'this product'} from bin ${form.binId}? This cannot be undone.`
            : `Move ${form.quantity || 0} unit(s) of ${selectedProduct ? selectedProduct.name : 'this product'} from bin ${form.binId} to bin ${form.toBinId}?`
        }
        confirmLabel={mode === 'outward' ? 'Remove stock' : 'Transfer stock'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          performSubmit();
        }}
      />
    </div>
  );
}
