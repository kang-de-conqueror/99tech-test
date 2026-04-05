import type { TokenPrice } from '../../types';
import { formatDisplayPrice } from '../../utils/priceUtils';

interface RateDisplayProps {
  fromToken: TokenPrice | null;
  toToken: TokenPrice | null;
  exchangeRate: number | null;
}

export function RateDisplay({ fromToken, toToken, exchangeRate }: RateDisplayProps) {
  const visible = fromToken && toToken;

  if (!visible) return null;

  if (!exchangeRate || !isFinite(exchangeRate)) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 text-white/40 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Rate unavailable
      </div>
    );
  }

  const inverseRate = 1 / exchangeRate;

  return (
    <div className="space-y-1 py-2 px-3 rounded-xl bg-white/5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/40">Exchange Rate</span>
        <span className="text-white/70 font-medium">
          1 {fromToken.currency} = {formatDisplayPrice(exchangeRate)} {toToken.currency}
        </span>
      </div>
      <div className="flex items-center justify-end text-xs text-white/30">
        1 {toToken.currency} = {formatDisplayPrice(inverseRate)} {fromToken.currency}
      </div>
    </div>
  );
}
