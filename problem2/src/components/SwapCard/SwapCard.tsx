import { usePrices } from '../../hooks/usePrices';
import { useSwapForm } from '../../hooks/useSwapForm';
import { AmountInput } from '../AmountInput/AmountInput';
import { TokenSelector } from '../TokenSelector/TokenSelector';
import { SwapArrow } from '../SwapArrow/SwapArrow';
import { RateDisplay } from '../RateDisplay/RateDisplay';
import { ConfirmButton } from '../ConfirmButton/ConfirmButton';
import { formatAmount } from '../../utils/priceUtils';

const GLASS_CARD_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
} as const;

const TOKEN_PANEL_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

function calcUsdValue(amount: string, price: number): string {
  const n = parseFloat(amount);
  if (!amount || isNaN(n)) return '0.00';
  return (n * price).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function SwapCard() {
  const { tokens, isLoading, fetchError, retry } = usePrices();
  const {
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
  } = useSwapForm();

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-3xl p-8 flex flex-col items-center gap-4" style={GLASS_CARD_STYLE}>
          <div
            className="w-12 h-12 rounded-full border-t-indigo-500 border-indigo-500/30 animate-spin"
            style={{ borderWidth: 3, borderStyle: 'solid' }}
          />
          <p className="text-white/50 text-sm">Fetching token prices...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-3xl p-8 flex flex-col items-center gap-4 text-center" style={GLASS_CARD_STYLE}>
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Connection Failed</p>
            <p className="text-white/50 text-sm">{fetchError}</p>
          </div>
          <button
            type="button"
            onClick={retry}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (state.isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-3xl p-8 flex flex-col items-center gap-5 text-center" style={GLASS_CARD_STYLE}>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white text-xl font-bold mb-2">Swap Confirmed!</p>
            <p className="text-white/50 text-sm">
              You swapped{' '}
              <span className="text-white font-medium">
                {state.fromAmount} {state.fromToken?.currency}
              </span>{' '}
              for{' '}
              <span className="text-white font-medium">
                {formatAmount(parseFloat(state.toAmount))} {state.toToken?.currency}
              </span>
            </p>
          </div>
          <div className="w-full pt-2">
            <button
              type="button"
              onClick={reset}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-base bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Swap Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-3xl p-6 flex flex-col gap-4" style={GLASS_CARD_STYLE}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-white text-xl font-bold">Swap Tokens</h1>
            <p className="text-white/40 text-sm mt-0.5">Exchange at the best rates</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* From Panel */}
        <div className="rounded-2xl p-4 space-y-3" style={TOKEN_PANEL_STYLE}>
          <div className="flex items-start gap-3">
            <AmountInput
              label="You Pay"
              value={state.fromAmount}
              onChange={setFromAmount}
              error={errors.fromAmount}
              disabled={state.isSubmitting}
            />
            <div className="pt-6">
              <TokenSelector
                tokens={tokens}
                selected={state.fromToken}
                onSelect={setFromToken}
                dimmedCurrency={state.toToken?.currency}
                disabled={state.isSubmitting}
              />
            </div>
          </div>
          {state.fromToken && (
            <div className="text-xs text-white/30">
              ≈ ${calcUsdValue(state.fromAmount, state.fromToken.price)} USD
            </div>
          )}
          {errors.fromToken && (
            <p className="text-red-400 text-xs font-medium">{errors.fromToken}</p>
          )}
        </div>

        {/* Swap Arrow */}
        <SwapArrow onSwap={swapDirection} disabled={state.isSubmitting} />

        {/* To Panel */}
        <div className="rounded-2xl p-4 space-y-3" style={TOKEN_PANEL_STYLE}>
          <div className="flex items-start gap-3">
            <AmountInput
              label="You Receive"
              value={state.toAmount}
              onChange={setToAmount}
              disabled={state.isSubmitting}
            />
            <div className="pt-6">
              <TokenSelector
                tokens={tokens}
                selected={state.toToken}
                onSelect={setToToken}
                dimmedCurrency={state.fromToken?.currency}
                disabled={state.isSubmitting}
              />
            </div>
          </div>
          {state.toToken && (
            <div className="text-xs text-white/30">
              ≈ ${calcUsdValue(state.toAmount, state.toToken.price)} USD
            </div>
          )}
          {errors.toToken && (
            <p className="text-red-400 text-xs font-medium">{errors.toToken}</p>
          )}
        </div>

        {/* Same token error */}
        {errors.sameToken && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-400 text-sm font-medium">{errors.sameToken}</p>
          </div>
        )}

        <RateDisplay
          fromToken={state.fromToken}
          toToken={state.toToken}
          exchangeRate={exchangeRate}
        />

        <ConfirmButton
          onClick={handleSubmit}
          isSubmitting={state.isSubmitting}
          disabled={!formValid}
        />
      </div>
    </div>
  );
}
