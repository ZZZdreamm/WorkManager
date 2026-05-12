const currency = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return currency.format(num);
}

const numberFmt = new Intl.NumberFormat('pl-PL');

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}
