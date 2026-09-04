import { useEffect, useState } from 'react';
import { searchProducts } from '../api/products';

// Builds a product_id -> { sku, name } map. The backend's movement/stock
// endpoints only return product_id, so this fills in the human-readable
// fields the UI needs without duplicating that data into components.
export function useProductLookup() {
  const [lookup, setLookup] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    searchProducts('')
      .then((products) => {
        if (cancelled) return;
        const map = {};
        for (const p of products) {
          map[p.id] = { sku: p.sku, name: p.name };
        }
        setLookup(map);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { lookup, loading };
}
