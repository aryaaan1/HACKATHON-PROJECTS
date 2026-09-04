import { useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import AdjustStockForm from '../components/admin/AdjustStockForm';
import AddProductForm from '../components/admin/AddProductForm';
import AddLocationForm from '../components/admin/AddLocationForm';
import CreateOrderForm from '../components/admin/CreateOrderForm';

const TABS = [
  { key: 'stock', label: 'Adjust Stock', component: AdjustStockForm, live: true },
  { key: 'product', label: 'Add Product', component: AddProductForm, live: false },
  { key: 'location', label: 'Add Warehouse/Row/Bin', component: AddLocationForm, live: false },
  { key: 'order', label: 'Create Order', component: CreateOrderForm, live: true },
];

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const active = TABS.some((t) => t.key === requestedTab) ? requestedTab : 'stock';
  const initialMode = searchParams.get('mode');
  const tab = TABS.find((t) => t.key === active);
  const ActiveForm = tab.component;

  function setActive(key) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', key);
      next.delete('mode');
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`min-h-[40px] shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
              active === t.key
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-brand-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card
        title={tab.label}
        subtitle={
          tab.live
            ? 'Connected to a live backend endpoint'
            : "This form is wired up but the backend doesn't implement this endpoint yet — submitting will show a real error"
        }
      >
        {tab.key === 'stock' ? <AdjustStockForm initialMode={initialMode} /> : <ActiveForm />}
      </Card>
    </div>
  );
}
