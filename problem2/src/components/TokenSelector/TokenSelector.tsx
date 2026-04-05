import { useEffect, useRef, useState } from 'react';
import type { TokenPrice } from '../../types';
import { TokenDropdown } from './TokenDropdown';
import { TokenIcon } from './TokenOption';

interface TokenSelectorProps {
  tokens: TokenPrice[];
  selected: TokenPrice | null;
  onSelect: (token: TokenPrice) => void;
  dimmedCurrency?: string;
  disabled?: boolean;
}

export function TokenSelector({
  tokens,
  selected,
  onSelect,
  dimmedCurrency,
  disabled,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  return (
    <div className="shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={[
          'flex items-center gap-2 rounded-2xl px-3 py-2 transition-all',
          'bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20',
          'text-white font-semibold text-sm',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {selected ? (
          <>
            <TokenIcon token={selected} size={24} />
            <span>{selected.currency}</span>
          </>
        ) : (
          <span className="text-white/50">Select token</span>
        )}
        <svg
          className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <TokenDropdown
          tokens={tokens}
          selectedCurrency={selected?.currency}
          dimmedCurrency={dimmedCurrency}
          onSelect={onSelect}
          onClose={() => setIsOpen(false)}
          triggerRef={triggerRef}
          dropdownRef={dropdownRef}
        />
      )}
    </div>
  );
}
