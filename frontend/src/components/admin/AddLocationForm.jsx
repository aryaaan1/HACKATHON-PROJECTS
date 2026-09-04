import { useState } from 'react';
import { createWarehouse, createRow, createBin } from '../../api/locations';
import FormField, { inputClass } from '../ui/FormField';
import FormBanner from './FormBanner';

const LEVELS = [
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'row', label: 'Row' },
  { key: 'bin', label: 'Bin' },
];

export default function AddLocationForm() {
  const [level, setLevel] = useState('warehouse');
  const [form, setForm] = useState({ name: '', warehouseId: '', rowId: '', locationCode: '' });
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
      if (level === 'warehouse') {
        await createWarehouse({ name: form.name });
      } else if (level === 'row') {
        await createRow({ warehouse_id: Number(form.warehouseId), name: form.name });
      } else {
        await createBin({ row_id: Number(form.rowId), location_code: form.locationCode });
      }
      setResult({ type: 'success', message: `${LEVELS.find((l) => l.key === level).label} created.` });
      setForm({ name: '', warehouseId: '', rowId: '', locationCode: '' });
    } catch (err) {
      setResult({ type: 'error', message: `${err.message} (this endpoint isn't implemented on the backend yet)` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex overflow-hidden rounded-lg border border-slate-200">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => { setLevel(l.key); setResult(null); }}
            className={`min-h-[40px] flex-1 px-4 py-2 text-xs font-medium transition-colors sm:flex-none ${
              level === l.key ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {level === 'warehouse' && (
          <FormField label="Warehouse Name">
            <input required className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} />
          </FormField>
        )}
        {level === 'row' && (
          <>
            <FormField label="Warehouse ID">
              <input required type="number" min="1" className={inputClass} value={form.warehouseId} onChange={(e) => update('warehouseId', e.target.value)} />
            </FormField>
            <FormField label="Row Name">
              <input required className={inputClass} placeholder="e.g. ROW-E" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </FormField>
          </>
        )}
        {level === 'bin' && (
          <>
            <FormField label="Row ID">
              <input required type="number" min="1" className={inputClass} value={form.rowId} onChange={(e) => update('rowId', e.target.value)} />
            </FormField>
            <FormField label="Location Code">
              <input required className={inputClass} placeholder="e.g. E-001" value={form.locationCode} onChange={(e) => update('locationCode', e.target.value)} />
            </FormField>
          </>
        )}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] w-full rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 sm:w-auto"
          >
            {submitting ? 'Submitting...' : `Add ${LEVELS.find((l) => l.key === level).label}`}
          </button>
        </div>
      </form>
      <FormBanner result={result} />
    </div>
  );
}
