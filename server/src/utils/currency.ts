import { CurrencyCode } from '../../../shared/types';

export function formatMoney(amount: number, currency: CurrencyCode) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode, rates: Record<CurrencyCode, number>) {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return amount; // fallback
  const base = amount / fromRate;
  return Number((base * toRate).toFixed(2));
}


