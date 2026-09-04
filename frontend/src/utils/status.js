// The backend only exposes each bin's low-stock threshold via /api/low-stock —
// product/location endpoints don't return it. So instead of guessing a
// threshold client-side, we treat /api/low-stock as the source of truth for
// which (product, bin) pairs are low/out, keyed by sku + bin location code
// (bin location codes are globally unique).
export function buildLowStockIndex(lowStockItems) {
  const map = new Map();
  for (const item of lowStockItems) {
    map.set(`${item.product_sku}::${item.bin_location_code}`, item.current_quantity);
  }
  return map;
}

export function getRowStockStatus(sku, binCode, quantity, lowStockIndex) {
  const flaggedQuantity = lowStockIndex?.get(`${sku}::${binCode}`);
  if (flaggedQuantity === undefined) {
    return { key: 'ok', label: 'In stock', tone: 'good' };
  }
  if (flaggedQuantity <= 0) {
    return { key: 'out', label: 'Out of stock', tone: 'critical' };
  }
  return { key: 'low', label: 'Low stock', tone: 'warning' };
}

export const MOVEMENT_TYPES = {
  INWARD: { label: 'Inward', tone: 'good' },
  OUTWARD: { label: 'Outward', tone: 'warning' },
  TRANSFER: { label: 'Transfer', tone: 'series' },
};

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
