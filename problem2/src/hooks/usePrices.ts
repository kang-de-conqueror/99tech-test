import { useEffect, useState, useCallback } from 'react';
import type { PriceEntry, TokenPrice } from '../types';
import { deduplicatePrices } from '../utils/priceUtils';

interface UsePricesResult {
  tokens: TokenPrice[];
  isLoading: boolean;
  fetchError: string | null;
  retry: () => void;
}

export function usePrices(): UsePricesResult {
  const [tokens, setTokens] = useState<TokenPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
    setFetchError(null);
    setIsLoading(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setFetchError(null);

    fetch('https://interview.switcheo.com/prices.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PriceEntry[]) => {
        if (cancelled) return;
        const tokenList = deduplicatePrices(data);
        setTokens(tokenList);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFetchError('Failed to fetch token prices. Please try again.');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  return { tokens, isLoading, fetchError, retry };
}
