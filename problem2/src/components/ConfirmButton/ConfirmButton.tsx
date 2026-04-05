interface ConfirmButtonProps {
  onClick: () => void;
  isSubmitting: boolean;
  disabled: boolean;
}

export function ConfirmButton({ onClick, isSubmitting, disabled }: ConfirmButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className={[
        'w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-200',
        'flex items-center justify-center gap-3',
        disabled || isSubmitting
          ? 'opacity-50 cursor-not-allowed bg-indigo-500/50 text-white/70'
          : 'bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isSubmitting ? (
        <>
          <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          <span>Swapping...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Confirm Swap</span>
        </>
      )}
    </button>
  );
}
