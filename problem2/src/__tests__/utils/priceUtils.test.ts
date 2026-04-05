import { describe, it, expect } from 'vitest';
import {
  buildIconUrl,
  deduplicatePrices,
  formatAmount,
  formatDisplayPrice,
  getExchangeRate,
} from '../../utils/priceUtils';
import type { PriceEntry, TokenPrice } from '../../types';

// ─── buildIconUrl ──────────────────────────────────────────────────────────

describe('buildIconUrl', () => {
  it('returns the correct CDN URL for a given symbol', () => {
    expect(buildIconUrl('ETH')).toBe(
      'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ETH.svg'
    );
  });

  it('preserves the symbol casing', () => {
    expect(buildIconUrl('wstETH')).toContain('wstETH.svg');
    expect(buildIconUrl('ampLUNA')).toContain('ampLUNA.svg');
  });
});

// ─── deduplicatePrices ────────────────────────────────────────────────────

describe('deduplicatePrices', () => {
  const base: PriceEntry[] = [
    { currency: 'ETH', date: '2023-08-29T07:10:52.000Z', price: 1645.93 },
    { currency: 'USDC', date: '2023-08-29T07:10:30.000Z', price: 1 },
    { currency: 'USDC', date: '2023-08-29T07:10:40.000Z', price: 0.989 },
    { currency: 'ATOM', date: '2023-08-29T07:10:50.000Z', price: 7.18 },
  ];

  it('picks the entry with the latest date when a currency appears multiple times', () => {
    const result = deduplicatePrices(base);
    const usdc = result.find((t) => t.currency === 'USDC');
    expect(usdc?.price).toBe(0.989); // later date wins
  });

  it('includes all unique currencies', () => {
    const result = deduplicatePrices(base);
    const currencies = result.map((t) => t.currency);
    expect(currencies).toContain('ETH');
    expect(currencies).toContain('USDC');
    expect(currencies).toContain('ATOM');
    expect(currencies).not.toContain(currencies.find((c, i) => currencies.indexOf(c) !== i)); // no dupes
  });

  it('sorts the result alphabetically by currency', () => {
    const result = deduplicatePrices(base);
    const currencies = result.map((t) => t.currency);
    expect(currencies).toEqual([...currencies].sort((a, b) => a.localeCompare(b)));
  });

  it('filters out entries with zero price', () => {
    const withZero: PriceEntry[] = [
      ...base,
      { currency: 'DEAD', date: '2023-08-29T07:10:00.000Z', price: 0 },
    ];
    const result = deduplicatePrices(withZero);
    expect(result.find((t) => t.currency === 'DEAD')).toBeUndefined();
  });

  it('filters out entries with negative price', () => {
    const withNeg: PriceEntry[] = [
      ...base,
      { currency: 'NEG', date: '2023-08-29T07:10:00.000Z', price: -1 },
    ];
    const result = deduplicatePrices(withNeg);
    expect(result.find((t) => t.currency === 'NEG')).toBeUndefined();
  });

  it('attaches an iconUrl to every entry', () => {
    const result = deduplicatePrices(base);
    result.forEach((t) => {
      expect(t.iconUrl).toBe(buildIconUrl(t.currency));
    });
  });

  it('returns an empty array for an empty input', () => {
    expect(deduplicatePrices([])).toEqual([]);
  });
});

// ─── getExchangeRate ──────────────────────────────────────────────────────

describe('getExchangeRate', () => {
  const eth: TokenPrice = { currency: 'ETH', price: 2000, iconUrl: '' };
  const usdc: TokenPrice = { currency: 'USDC', price: 1, iconUrl: '' };
  const wbtc: TokenPrice = { currency: 'WBTC', price: 40000, iconUrl: '' };

  it('returns from.price / to.price', () => {
    expect(getExchangeRate(eth, usdc)).toBe(2000);
  });

  it('returns a fractional rate when from is cheaper than to', () => {
    expect(getExchangeRate(usdc, eth)).toBeCloseTo(0.0005);
  });

  it('returns cross-rates correctly', () => {
    expect(getExchangeRate(eth, wbtc)).toBeCloseTo(0.05);
  });

  it('returns 0 when the denominator token has zero price', () => {
    const zero: TokenPrice = { currency: 'ZERO', price: 0, iconUrl: '' };
    expect(getExchangeRate(eth, zero)).toBe(0);
  });
});

// ─── formatAmount ─────────────────────────────────────────────────────────

describe('formatAmount', () => {
  it('formats a whole number without trailing decimal', () => {
    expect(formatAmount(100)).toBe('100');
  });

  it('strips trailing zeros after the decimal point', () => {
    expect(formatAmount(1.5)).toBe('1.5');
    expect(formatAmount(1.50000)).toBe('1.5');
  });

  it('respects the maxDecimals parameter', () => {
    const result = formatAmount(1.123456789, 4);
    expect(result).toBe('1.1235'); // toFixed rounds
  });

  it('returns empty string for NaN', () => {
    expect(formatAmount(NaN)).toBe('');
  });

  it('returns empty string for Infinity', () => {
    expect(formatAmount(Infinity)).toBe('');
    expect(formatAmount(-Infinity)).toBe('');
  });

  it('handles very small numbers without scientific notation', () => {
    const result = formatAmount(0.00001234);
    expect(result).not.toContain('e');
    expect(result).toBe('0.00001234');
  });

  it('handles zero', () => {
    expect(formatAmount(0)).toBe('0');
  });
});

// ─── formatDisplayPrice ───────────────────────────────────────────────────

describe('formatDisplayPrice', () => {
  it('returns "—" for NaN', () => {
    expect(formatDisplayPrice(NaN)).toBe('—');
  });

  it('returns "—" for Infinity', () => {
    expect(formatDisplayPrice(Infinity)).toBe('—');
  });

  it('formats large numbers with 2 decimal places', () => {
    const result = formatDisplayPrice(26000.5);
    expect(result).toBe('26,000.5'); // toLocaleString en-US
  });

  it('formats medium numbers (1–999) with up to 4 decimal places', () => {
    const result = formatDisplayPrice(7.1867);
    expect(parseFloat(result)).toBeCloseTo(7.1867, 3);
  });

  it('delegates small numbers (< 1) to formatAmount', () => {
    const result = formatDisplayPrice(0.004039);
    expect(result).not.toContain('e');
    expect(parseFloat(result)).toBeCloseTo(0.004039, 5);
  });
});
