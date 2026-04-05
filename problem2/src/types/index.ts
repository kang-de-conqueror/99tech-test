export interface PriceEntry {
  currency: string;
  date: string;
  price: number;
}

export interface TokenPrice {
  currency: string;
  price: number;
  iconUrl: string;
}

export interface ValidationErrors {
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  sameToken?: string;
}

export interface SwapFormState {
  fromToken: TokenPrice | null;
  toToken: TokenPrice | null;
  fromAmount: string;
  toAmount: string;
  isSubmitting: boolean;
  isSuccess: boolean;
}

export type SwapAction =
  | { type: 'SET_FROM_TOKEN'; payload: TokenPrice }
  | { type: 'SET_TO_TOKEN'; payload: TokenPrice }
  | { type: 'SET_FROM_AMOUNT'; payload: string }
  | { type: 'SET_TO_AMOUNT'; payload: string }
  | { type: 'SWAP_DIRECTION' }
  | { type: 'BEGIN_SUBMIT' }
  | { type: 'FINISH_SUBMIT' }
  | { type: 'RESET' };
