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

// Each movement type carries a color tone (Badge) AND a distinct glyph/icon
// background so the type is never communicated by color alone.
export const MOVEMENT_TYPES = {
  INWARD: { label: 'Inward', tone: 'good', glyph: '↓', iconBg: 'bg-status-good-bg text-status-good' },
  OUTWARD: { label: 'Outward', tone: 'warning', glyph: '↑', iconBg: 'bg-status-warning-bg text-status-warning' },
  TRANSFER: { label: 'Transfer', tone: 'series', glyph: '⇄', iconBg: 'bg-brand-50 text-brand-600' },
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

export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return formatDateTime(isoString);
}
