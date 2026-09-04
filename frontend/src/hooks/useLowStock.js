import { useEffect, useState } from 'react';
import { getLowStock } from '../api/stock';
import { buildLowStockIndex } from '../utils/status';

export function useLowStock() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLowStock()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setIndex(buildLowStockIndex(data));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, index, loading };
}
