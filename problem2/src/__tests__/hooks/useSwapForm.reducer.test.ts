import { describe, it, expect } from 'vitest';
import { reducer, initialState } from '../../hooks/useSwapForm';
import type { SwapFormState, TokenPrice } from '../../types';

const eth: TokenPrice = { currency: 'ETH', price: 2000, iconUrl: '' };
const usdc: TokenPrice = { currency: 'USDC', price: 1, iconUrl: '' };
const wbtc: TokenPrice = { currency: 'WBTC', price: 40000, iconUrl: '' };

function stateWith(overrides: Partial<SwapFormState>): SwapFormState {
  return { ...initialState, ...overrides };
}

// ─── SET_FROM_TOKEN ───────────────────────────────────────────────────────

describe('SET_FROM_TOKEN', () => {
  it('sets fromToken', () => {
    const state = reducer(initialState, { type: 'SET_FROM_TOKEN', payload: eth });
    expect(state.fromToken).toEqual(eth);
  });

  it('recalculates toAmount when toToken is already set', () => {
    const prev = stateWith({ toToken: usdc, fromAmount: '1' });
    const state = reducer(prev, { type: 'SET_FROM_TOKEN', payload: eth });
    // 1 ETH * (2000/1) = 2000 USDC
    expect(parseFloat(state.toAmount)).toBeCloseTo(2000);
  });

  it('clears toAmount when toToken is not set', () => {
    const prev = stateWith({ toAmount: '5', fromAmount: '1' });
    const state = reducer(prev, { type: 'SET_FROM_TOKEN', payload: eth });
    expect(state.toAmount).toBe('');
  });
});

// ─── SET_TO_TOKEN ─────────────────────────────────────────────────────────

describe('SET_TO_TOKEN', () => {
  it('sets toToken', () => {
    const state = reducer(initialState, { type: 'SET_TO_TOKEN', payload: usdc });
    expect(state.toToken).toEqual(usdc);
  });

  it('recalculates toAmount when fromToken and fromAmount are already set', () => {
    const prev = stateWith({ fromToken: eth, fromAmount: '2' });
    const state = reducer(prev, { type: 'SET_TO_TOKEN', payload: usdc });
    // 2 ETH * (2000/1) = 4000 USDC
    expect(parseFloat(state.toAmount)).toBeCloseTo(4000);
  });
});

// ─── SET_FROM_AMOUNT ──────────────────────────────────────────────────────

describe('SET_FROM_AMOUNT', () => {
  it('sets fromAmount', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc });
    const state = reducer(prev, { type: 'SET_FROM_AMOUNT', payload: '3' });
    expect(state.fromAmount).toBe('3');
  });

  it('auto-calculates toAmount from the exchange rate', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc });
    const state = reducer(prev, { type: 'SET_FROM_AMOUNT', payload: '1' });
    expect(parseFloat(state.toAmount)).toBeCloseTo(2000);
  });

  it('preserves a trailing decimal and calculates toAmount using the numeric value', () => {
    // "1." parses as 1, so toAmount should be 2000 — no NaN, no crash
    const prev = stateWith({ fromToken: eth, toToken: usdc });
    const state = reducer(prev, { type: 'SET_FROM_AMOUNT', payload: '1.' });
    expect(state.fromAmount).toBe('1.');
    expect(parseFloat(state.toAmount)).toBeCloseTo(2000);
  });

  it('clears toAmount for a bare decimal point (incomplete entry)', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc, toAmount: '2000' });
    const state = reducer(prev, { type: 'SET_FROM_AMOUNT', payload: '.' });
    expect(state.toAmount).toBe('');
  });

  it('clears toAmount when fromAmount is empty', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc, toAmount: '2000' });
    const state = reducer(prev, { type: 'SET_FROM_AMOUNT', payload: '' });
    expect(state.toAmount).toBe('');
  });

  it('leaves toAmount empty when no tokens are selected', () => {
    const state = reducer(initialState, { type: 'SET_FROM_AMOUNT', payload: '5' });
    expect(state.toAmount).toBe('');
  });
});

// ─── SET_TO_AMOUNT ────────────────────────────────────────────────────────

describe('SET_TO_AMOUNT', () => {
  it('sets toAmount', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc });
    const state = reducer(prev, { type: 'SET_TO_AMOUNT', payload: '2000' });
    expect(state.toAmount).toBe('2000');
  });

  it('reverse-calculates fromAmount', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc });
    const state = reducer(prev, { type: 'SET_TO_AMOUNT', payload: '4000' });
    // 4000 USDC / (2000/1) = 2 ETH
    expect(parseFloat(state.fromAmount)).toBeCloseTo(2);
  });

  it('clears fromAmount when toAmount is empty', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc, fromAmount: '2' });
    const state = reducer(prev, { type: 'SET_TO_AMOUNT', payload: '' });
    expect(state.fromAmount).toBe('');
  });
});

// ─── SWAP_DIRECTION ───────────────────────────────────────────────────────

describe('SWAP_DIRECTION', () => {
  it('swaps fromToken and toToken', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc });
    const state = reducer(prev, { type: 'SWAP_DIRECTION' });
    expect(state.fromToken).toEqual(usdc);
    expect(state.toToken).toEqual(eth);
  });

  it('keeps fromAmount unchanged', () => {
    const prev = stateWith({ fromToken: eth, toToken: usdc, fromAmount: '1' });
    const state = reducer(prev, { type: 'SWAP_DIRECTION' });
    expect(state.fromAmount).toBe('1');
  });

  it('recalculates toAmount using the new rate', () => {
    // ETH→USDC: 1 ETH = 2000 USDC; after swap USDC→ETH: 1 USDC = 0.0005 ETH
    const prev = stateWith({ fromToken: eth, toToken: usdc, fromAmount: '1', toAmount: '2000' });
    const state = reducer(prev, { type: 'SWAP_DIRECTION' });
    expect(parseFloat(state.toAmount)).toBeCloseTo(0.0005);
  });

  it('handles swap when one token is null', () => {
    const prev = stateWith({ fromToken: eth, toToken: null, fromAmount: '1' });
    const state = reducer(prev, { type: 'SWAP_DIRECTION' });
    expect(state.fromToken).toBeNull();
    expect(state.toToken).toEqual(eth);
    expect(state.toAmount).toBe('');
  });

  it('handles a three-token rotation correctly', () => {
    // Start: ETH → WBTC with fromAmount 1; toAmount should be 1 * 2000/40000 = 0.05
    const prev = stateWith({ fromToken: eth, toToken: wbtc, fromAmount: '1' });
    const first = reducer(prev, { type: 'SET_FROM_AMOUNT', payload: '1' });
    expect(parseFloat(first.toAmount)).toBeCloseTo(0.05);
    // Swap: WBTC → ETH, fromAmount stays 1; 1 WBTC = 40000/2000 = 20 ETH
    const swapped = reducer(first, { type: 'SWAP_DIRECTION' });
    expect(parseFloat(swapped.toAmount)).toBeCloseTo(20);
  });
});

// ─── BEGIN_SUBMIT / FINISH_SUBMIT ─────────────────────────────────────────

describe('BEGIN_SUBMIT / FINISH_SUBMIT', () => {
  it('sets isSubmitting to true on BEGIN_SUBMIT', () => {
    const state = reducer(initialState, { type: 'BEGIN_SUBMIT' });
    expect(state.isSubmitting).toBe(true);
  });

  it('sets isSubmitting to false and isSuccess to true on FINISH_SUBMIT', () => {
    const prev = stateWith({ isSubmitting: true });
    const state = reducer(prev, { type: 'FINISH_SUBMIT' });
    expect(state.isSubmitting).toBe(false);
    expect(state.isSuccess).toBe(true);
  });
});

// ─── RESET ───────────────────────────────────────────────────────────────

describe('RESET', () => {
  it('returns to the initial state', () => {
    const dirty = stateWith({
      fromToken: eth,
      toToken: usdc,
      fromAmount: '10',
      toAmount: '20000',
      isSubmitting: false,
      isSuccess: true,
    });
    const state = reducer(dirty, { type: 'RESET' });
    expect(state).toEqual(initialState);
  });
});
