import type { SwapFormState, ValidationErrors } from '../types';

export function validateSwapForm(state: SwapFormState): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!state.fromToken) {
    errors.fromToken = 'Please select a token to swap from';
  }

  if (!state.toToken) {
    errors.toToken = 'Please select a token to receive';
  }

  if (
    state.fromToken &&
    state.toToken &&
    state.fromToken.currency === state.toToken.currency
  ) {
    errors.sameToken = 'Cannot swap a token with itself';
  }

  if (!state.fromAmount || state.fromAmount === '.') {
    errors.fromAmount = 'Please enter an amount';
  } else {
    const parsed = parseFloat(state.fromAmount);
    if (isNaN(parsed) || !isFinite(parsed)) {
      errors.fromAmount = 'Invalid amount';
    } else if (parsed <= 0) {
      errors.fromAmount = 'Amount must be greater than zero';
    } else if (parsed > 1e15) {
      errors.fromAmount = 'Amount is too large';
    }
  }

  return errors;
}

export function isFormValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}
