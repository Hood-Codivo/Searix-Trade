export function formatPrice(value: number) {
  if (value >= 100) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 1) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return value.toLocaleString('en-US', { minimumFractionDigits: value < 0.001 ? 8 : 4, maximumFractionDigits: value < 0.001 ? 8 : 4 });
}

export function formatCompactUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
