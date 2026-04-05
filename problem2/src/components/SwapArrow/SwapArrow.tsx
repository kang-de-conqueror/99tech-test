import { useState } from 'react';

interface SwapArrowProps {
  onSwap: () => void;
  disabled?: boolean;
}

export function SwapArrow({ onSwap, disabled }: SwapArrowProps) {
  const [rotated, setRotated] = useState(false);

  function handleClick() {
    setRotated((r) => !r);
    onSwap();
  }

  return (
    <div className="flex items-center justify-center py-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={[
          'w-10 h-10 rounded-full flex items-center justify-center',
          'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40',
          'text-white transition-all duration-200',
          'hover:scale-110 active:scale-95',
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ]
          .filter(Boolean)
          .join(' ')}
        title="Switch tokens"
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${rotated ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      </button>
    </div>
  );
}
