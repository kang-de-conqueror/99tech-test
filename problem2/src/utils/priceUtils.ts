import type { PriceEntry, TokenPrice } from '../types';

export function buildIconUrl(symbol: string): string {
  return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${symbol}.svg`;
}

export function deduplicatePrices(entries: PriceEntry[]): TokenPrice[] {
  const map = new Map<string, PriceEntry>();

  for (const entry of entries) {
    if (entry.price <= 0) continue;
    const existing = map.get(entry.currency);
    if (!existing || entry.date > existing.date) {
      map.set(entry.currency, entry);
    }
  }

  return Array.from(map.values())
    .map((entry) => ({
      currency: entry.currency,
      price: entry.price,
      iconUrl: buildIconUrl(entry.currency),
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export function getExchangeRate(from: TokenPrice, to: TokenPrice): number {
  if (!to.price || to.price === 0) return 0;
  return from.price / to.price;
}

export function formatAmount(n: number, maxDecimals = 8): string {
  if (!isFinite(n) || isNaN(n)) return '';

  // Use up to maxDecimals significant decimal places, avoid scientific notation
  const fixed = n.toFixed(maxDecimals);
  // Strip trailing zeros after decimal point
  const stripped = fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return stripped;
}

export function formatDisplayPrice(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (n >= 1000) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  if (n >= 1) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
  return formatAmount(n, 6);
}
