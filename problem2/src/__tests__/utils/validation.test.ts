import { describe, it, expect } from 'vitest';
import { validateSwapForm, isFormValid } from '../../utils/validation';
import type { SwapFormState } from '../../types';

const token = (currency: string) => ({ currency, price: 1, iconUrl: '' });

function makeState(overrides: Partial<SwapFormState> = {}): SwapFormState {
  return {
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    isSubmitting: false,
    isSuccess: false,
    ...overrides,
  };
}

// ─── validateSwapForm ─────────────────────────────────────────────────────

describe('validateSwapForm', () => {
  describe('fromToken', () => {
    it('errors when fromToken is null', () => {
      const errors = validateSwapForm(makeState({ toToken: token('ETH'), fromAmount: '1' }));
      expect(errors.fromToken).toBeDefined();
    });

    it('has no fromToken error when fromToken is set', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('USDC'), toToken: token('ETH'), fromAmount: '1' })
      );
      expect(errors.fromToken).toBeUndefined();
    });
  });

  describe('toToken', () => {
    it('errors when toToken is null', () => {
      const errors = validateSwapForm(makeState({ fromToken: token('USDC'), fromAmount: '1' }));
      expect(errors.toToken).toBeDefined();
    });

    it('has no toToken error when toToken is set', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('USDC'), toToken: token('ETH'), fromAmount: '1' })
      );
      expect(errors.toToken).toBeUndefined();
    });
  });

  describe('sameToken', () => {
    it('errors when fromToken and toToken are the same currency', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('ETH'), fromAmount: '1' })
      );
      expect(errors.sameToken).toBeDefined();
    });

    it('has no sameToken error for different currencies', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '1' })
      );
      expect(errors.sameToken).toBeUndefined();
    });
  });

  describe('fromAmount', () => {
    it('errors when fromAmount is empty', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '' })
      );
      expect(errors.fromAmount).toBeDefined();
    });

    it('errors when fromAmount is just a dot', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '.' })
      );
      expect(errors.fromAmount).toBeDefined();
    });

    it('errors when fromAmount is zero', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '0' })
      );
      expect(errors.fromAmount).toBeDefined();
    });

    it('errors when fromAmount is negative', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '-1' })
      );
      expect(errors.fromAmount).toBeDefined();
    });

    it('errors when fromAmount exceeds 1e15', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '1e16' })
      );
      expect(errors.fromAmount).toBeDefined();
    });

    it('errors when fromAmount is Infinity', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: 'Infinity' })
      );
      expect(errors.fromAmount).toBeDefined();
    });

    it('has no fromAmount error for a valid positive number', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '1.5' })
      );
      expect(errors.fromAmount).toBeUndefined();
    });

    it('has no fromAmount error for a very small positive number', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '0.00001' })
      );
      expect(errors.fromAmount).toBeUndefined();
    });
  });

  describe('valid form', () => {
    it('returns no errors for a fully valid state', () => {
      const errors = validateSwapForm(
        makeState({ fromToken: token('ETH'), toToken: token('USDC'), fromAmount: '1' })
      );
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});

// ─── isFormValid ──────────────────────────────────────────────────────────

describe('isFormValid', () => {
  it('returns true when there are no errors', () => {
    expect(isFormValid({})).toBe(true);
  });

  it('returns false when any error exists', () => {
    expect(isFormValid({ fromToken: 'required' })).toBe(false);
    expect(isFormValid({ fromAmount: 'required' })).toBe(false);
    expect(isFormValid({ sameToken: 'same' })).toBe(false);
  });
});
