import { useState } from 'react';
import type { TokenPrice } from '../../types';
import { formatDisplayPrice } from '../../utils/priceUtils';

interface TokenOptionProps {
  token: TokenPrice;
  onSelect: (token: TokenPrice) => void;
  isSelected?: boolean;
  isDimmed?: boolean;
}

function getFallbackColor(symbol: string): string {
  const hue = (symbol.charCodeAt(0) * 37 + (symbol.charCodeAt(1) || 0) * 13) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export function TokenIcon({ token, size = 32 }: { token: TokenPrice; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const color = getFallbackColor(token.currency);

  if (hasError) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
        style={{
          width: size,
          height: size,
          background: color,
          fontSize: size * 0.35,
        }}
      >
        {token.currency.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={token.iconUrl}
      alt={token.currency}
      width={size}
      height={size}
      className="rounded-full shrink-0 object-contain bg-white/5"
      onError={() => setHasError(true)}
    />
  );
}

export function TokenOption({ token, onSelect, isSelected, isDimmed }: TokenOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(token)}
      className={[
        'w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
        isSelected
          ? 'bg-indigo-500/20 text-white'
          : 'hover:bg-white/5 text-white/80 hover:text-white',
        isDimmed ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <TokenIcon token={token} size={32} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{token.currency}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-white/50">${formatDisplayPrice(token.price)}</div>
      </div>
      {isSelected && (
        <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
