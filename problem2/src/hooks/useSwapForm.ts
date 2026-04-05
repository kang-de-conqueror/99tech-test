import { useReducer, useMemo, useCallback } from 'react';
import type { SwapFormState, SwapAction, TokenPrice } from '../types';
import { getExchangeRate, formatAmount } from '../utils/priceUtils';
import { validateSwapForm, isFormValid } from '../utils/validation';

export const initialState: SwapFormState = {
  fromToken: null,
  toToken: null,
  fromAmount: '',
  toAmount: '',
  isSubmitting: false,
  isSuccess: false,
};

/** Derive the current exchange rate directly from state tokens. */
function getRateFromState(state: SwapFormState): number | null {
  if (!state.fromToken || !state.toToken) return null;
  const rate = getExchangeRate(state.fromToken, state.toToken);
  return rate === 0 || !isFinite(rate) ? null : rate;
}

function calcToAmount(fromAmount: string, rate: number | null): string {
  if (!fromAmount || fromAmount === '.' || rate === null) return '';
  const parsed = parseFloat(fromAmount);
  if (isNaN(parsed) || !isFinite(parsed)) return '';
  return formatAmount(parsed * rate);
}

function calcFromAmount(toAmount: string, rate: number | null): string {
  if (!toAmount || toAmount === '.' || rate === null) return '';
  const parsed = parseFloat(toAmount);
  if (isNaN(parsed) || !isFinite(parsed)) return '';
  return formatAmount(parsed / rate);
}

export function reducer(state: SwapFormState, action: SwapAction): SwapFormState {
  switch (action.type) {
    case 'SET_FROM_TOKEN': {
      const newFrom = action.payload;
      const rate = state.toToken ? getExchangeRate(newFrom, state.toToken) : null;
      const validRate = rate === 0 || !isFinite(rate ?? 0) ? null : rate;
      return {
        ...state,
        fromToken: newFrom,
        toAmount: calcToAmount(state.fromAmount, validRate),
      };
    }
    case 'SET_TO_TOKEN': {
      const newTo = action.payload;
      const rate = state.fromToken ? getExchangeRate(state.fromToken, newTo) : null;
      const validRate = rate === 0 || !isFinite(rate ?? 0) ? null : rate;
      return {
        ...state,
        toToken: newTo,
        toAmount: calcToAmount(state.fromAmount, validRate),
      };
    }
    case 'SET_FROM_AMOUNT': {
      const rate = getRateFromState(state);
      return {
        ...state,
        fromAmount: action.payload,
        toAmount: calcToAmount(action.payload, rate),
      };
    }
    case 'SET_TO_AMOUNT': {
      const rate = getRateFromState(state);
      return {
        ...state,
        toAmount: action.payload,
        fromAmount: calcFromAmount(action.payload, rate),
      };
    }
    case 'SWAP_DIRECTION': {
      const newFrom = state.toToken;
      const newTo = state.fromToken;
      const rate = newFrom && newTo ? getExchangeRate(newFrom, newTo) : null;
      const validRate = rate === 0 || !isFinite(rate ?? 0) ? null : rate;
      return {
        ...state,
        fromToken: newFrom,
        toToken: newTo,
        toAmount: calcToAmount(state.fromAmount, validRate),
      };
    }
    case 'BEGIN_SUBMIT':
      return { ...state, isSubmitting: true };
    case 'FINISH_SUBMIT':
      return { ...state, isSubmitting: false, isSuccess: true };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface UseSwapFormResult {
  state: SwapFormState;
  exchangeRate: number | null;
  errors: ReturnType<typeof validateSwapForm>;
  formValid: boolean;
  setFromToken: (token: TokenPrice) => void;
  setToToken: (token: TokenPrice) => void;
  setFromAmount: (value: string) => void;
  setToAmount: (value: string) => void;
  swapDirection: () => void;
  handleSubmit: () => void;
  reset: () => void;
}

export function useSwapForm(): UseSwapFormResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  const exchangeRate = useMemo(() => getRateFromState(state), [state]);
  const errors = useMemo(() => validateSwapForm(state), [state]);
  const formValid = useMemo(() => isFormValid(errors), [errors]);

  const setFromToken = useCallback((token: TokenPrice) => {
    dispatch({ type: 'SET_FROM_TOKEN', payload: token });
  }, []);

  const setToToken = useCallback((token: TokenPrice) => {
    dispatch({ type: 'SET_TO_TOKEN', payload: token });
  }, []);

  const setFromAmount = useCallback((value: string) => {
    dispatch({ type: 'SET_FROM_AMOUNT', payload: value });
  }, []);

  const setToAmount = useCallback((value: string) => {
    dispatch({ type: 'SET_TO_AMOUNT', payload: value });
  }, []);

  const swapDirection = useCallback(() => {
    dispatch({ type: 'SWAP_DIRECTION' });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formValid || state.isSubmitting) return;
    dispatch({ type: 'BEGIN_SUBMIT' });
    setTimeout(() => {
      dispatch({ type: 'FINISH_SUBMIT' });
    }, 2000);
  }, [formValid, state.isSubmitting]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    exchangeRate,
    errors,
    formValid,
    setFromToken,
    setToToken,
    setFromAmount,
    setToAmount,
    swapDirection,
    handleSubmit,
    reset,
  };
}
