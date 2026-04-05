import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TokenPrice } from '../../types';
import { TokenOption } from './TokenOption';

interface TokenDropdownProps {
  tokens: TokenPrice[];
  selectedCurrency?: string;
  dimmedCurrency?: string;
  onSelect: (token: TokenPrice) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export function TokenDropdown({
  tokens,
  selectedCurrency,
  dimmedCurrency,
  onSelect,
  onClose,
  triggerRef,
  dropdownRef,
}: TokenDropdownProps) {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchRef = useRef<HTMLInputElement>(null);
  // Store latest onClose in a ref so the keydown effect never needs to re-register
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 260),
      });
    }
    searchRef.current?.focus();
  }, []); // runs once on mount; triggerRef.current is already set when dropdown opens

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // stable: reads from ref, no re-registration needed

  const filtered = tokens.filter((t) =>
    t.currency.toLowerCase().includes(search.toLowerCase())
  );

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed z-50 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        background: 'rgba(20, 17, 45, 0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-white/40 text-sm">
            No tokens found
          </div>
        ) : (
          filtered.map((token) => (
            <TokenOption
              key={token.currency}
              token={token}
              onSelect={(t) => {
                onSelect(t);
                onClose();
              }}
              isSelected={token.currency === selectedCurrency}
              isDimmed={token.currency === dimmedCurrency}
            />
          ))
        )}
      </div>
    </div>
  );

  return createPortal(dropdown, document.body);
}
