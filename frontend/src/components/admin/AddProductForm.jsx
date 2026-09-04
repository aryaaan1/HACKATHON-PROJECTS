import { useState } from 'react';
import { createProduct } from '../../api/products';
import FormField, { inputClass } from '../ui/FormField';
import FormBanner from './FormBanner';

export default function AddProductForm() {
  const [form, setForm] = useState({ sku: '', name: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      await createProduct(form);
      setResult({ type: 'success', message: 'Product created.' });
      setForm({ sku: '', name: '', category: '' });
    } catch (err) {
      setResult({ type: 'error', message: `${err.message} (this endpoint isn't implemented on the backend yet)` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="SKU">
          <input required className={inputClass} value={form.sku} onChange={(e) => update('sku', e.target.value)} />
        </FormField>
        <FormField label="Product Name">
          <input required className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} />
        </FormField>
        <FormField label="Category (optional)">
          <input className={inputClass} value={form.category} onChange={(e) => update('category', e.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] w-full rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 sm:w-auto"
          >
            {submitting ? 'Submitting...' : 'Add Product'}
          </button>
        </div>
      </form>
      <FormBanner result={result} />
    </div>
  );
}
