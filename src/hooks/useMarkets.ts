import { useCallback, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useWallet } from '@/context/WalletProvider';
import { marketApi } from '@/services/api';
import { acquireSubmission } from '@/services/wallet/submission-lock';
import { subscribeToMarketUpdates, subscribeToStreamStatus, type StreamStatus } from '@/services/marketStream';
import type { Alert, AssetRegistryEntry, CandleRange, ExecutionReceipt, FeesConfig, Market, RevenueSummary, TradeSide } from '@/types/market';

type Resource<T> = { data: T; error: string | null; loading: boolean };

export function useMarkets() {
  const [resource, setResource] = useState<Resource<Market[]>>({ data: [], error: null, loading: true });
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const load = useCallback(async () => {
    setResource((current) => ({ ...current, error: null, loading: current.data.length === 0 }));
    try {
      const data = await marketApi.list();
      setResource({ data, error: null, loading: false });
    } catch (error) {
      setResource((current) => ({ ...current, error: error instanceof Error ? error.message : 'Couldn’t load markets.', loading: false }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeToStreamStatus(setStatus), []);

  useEffect(
    () =>
      subscribeToMarketUpdates((market) => {
        setResource((current) => {
          const index = current.data.findIndex((existing) => existing.id === market.id);
          const data = index === -1 ? [...current.data, market] : current.data.map((existing, i) => (i === index ? market : existing));
          return { data, error: null, loading: false };
        });
      }),
    []
  );

  return { ...resource, status, retry: () => load() };
}

export function useMarket(id?: string) {
  const [resource, setResource] = useState<Resource<Market | null>>({ data: null, error: null, loading: true });
  const load = useCallback(async () => {
    if (!id) return;
    setResource((current) => ({ ...current, error: null, loading: current.data === null }));
    try {
      const data = await marketApi.get(id);
      setResource({ data, error: null, loading: false });
    } catch (error) {
      setResource({ data: null, error: error instanceof Error ? error.message : 'Couldn’t load this market.', loading: false });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () =>
      subscribeToMarketUpdates((market) => {
        if (market.id !== id) return;
        setResource({ data: market, error: null, loading: false });
      }),
    [id]
  );

  return { ...resource, retry: () => load() };
}

export function useCandles(id: string | undefined, range: CandleRange) {
  const [resource, setResource] = useState<Resource<number[]>>({ data: [], error: null, loading: true });
  const load = useCallback(async () => {
    if (!id) return;
    setResource((current) => ({ ...current, error: null, loading: current.data.length === 0 }));
    try {
      const { values } = await marketApi.candles(id, range);
      setResource({ data: values, error: null, loading: false });
    } catch (error) {
      setResource((current) => ({ ...current, error: error instanceof Error ? error.message : 'Couldn’t load chart data.', loading: false }));
    }
  }, [id, range]);

  useEffect(() => {
    setResource({ data: [], error: null, loading: true });
    void load();
    const interval = setInterval(() => void load(), 5_000);
    return () => clearInterval(interval);
  }, [load]);

  return { ...resource, retry: () => load() };
}

export function useReceipts() {
  const { account } = useWallet();
  const [resource, setResource] = useState<Resource<ExecutionReceipt[]>>({ data: [], error: null, loading: true });
  // Refresh on wallet changes as well as screen focus.
  const load = useCallback(async () => {
    setResource((current) => ({ ...current, error: null, loading: current.data.length === 0 }));
    try {
      const data = await marketApi.listReceipts();
      setResource({ data, error: null, loading: false });
    } catch (error) {
      setResource((current) => ({ ...current, error: error instanceof Error ? error.message : 'Couldn’t load your receipts.', loading: false }));
    }
  }, [account?.address]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...resource, data: resource.data.filter(receipt => Boolean(account) && receipt.walletAddress === account?.address), retry: load };
}

export function useAlerts(wallet?: string) {
  const [resource, setResource] = useState<Resource<Alert[]>>({ data: [], error: null, loading: true });
  const load = useCallback(async () => {
    setResource((current) => ({ ...current, error: null, loading: current.data.length === 0 }));
    try {
      const data = await marketApi.listAlerts(wallet);
      setResource({ data, error: null, loading: false });
    } catch (error) {
      setResource((current) => ({ ...current, error: error instanceof Error ? error.message : 'Couldn’t load alerts.', loading: false }));
    }
  }, [wallet]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  return { ...resource, retry: load };
}

export function useRegistryEntry(symbol: string | undefined) {
  const [resource, setResource] = useState<Resource<AssetRegistryEntry | null>>({ data: null, error: null, loading: true });
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setResource({ data: null, error: null, loading: true });
    marketApi.registryEntry(symbol)
      .then((data) => { if (!cancelled) setResource({ data, error: null, loading: false }); })
      .catch((error) => { if (!cancelled) setResource({ data: null, error: error instanceof Error ? error.message : 'Couldn’t load registry info.', loading: false }); });
    return () => { cancelled = true; };
  }, [symbol]);

  return resource;
}

export type ExecuteOrderState = 'idle' | 'building' | 'awaiting-signature' | 'confirming' | 'executed' | 'pending-confirmation' | 'error';

type PendingExecution = { marketId: string; params: Parameters<typeof marketApi.confirmExecution>[1] };
// Keep confirmed-submission retries separate from signing, including screen remounts.
const pendingExecutions = new Map<string, PendingExecution>();

// Orchestrates the real execute flow: build an unsigned transaction on the backend, sign + submit
// it via the user's own wallet (never the backend), then ask the backend to verify it on-chain
// before treating it as a real receipt.
export function useExecuteOrder(market: Market) {
  const marketId = market.id;
  const { account, network, signAndSendTransaction } = useWallet();
  const busy = useRef(false);
  const pendingKey = `${account?.address ?? ''}:${marketId}`;
  const pendingStorageKey = `searix.pending.${pendingKey.replace(/[^a-zA-Z0-9._-]/g, char => `_${char.charCodeAt(0)}_`)}`;
  const [state, setState] = useState<ExecuteOrderState>(pendingExecutions.has(pendingKey) ? 'pending-confirmation' : 'idle');
  const [receipt, setReceipt] = useState<ExecutionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmPending = useCallback(async () => {
    const pending = pendingExecutions.get(pendingKey);
    if (!pending) return null;
    setState('confirming');
    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const saved = await marketApi.confirmExecution(pending.marketId, pending.params);
        await SecureStore.deleteItemAsync(pendingStorageKey);
        pendingExecutions.delete(pendingKey);
        setReceipt(saved); setError(null); setState('executed'); return saved;
      } catch (err) {
        lastError = err;
        if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
    setState('pending-confirmation');
    setError(`Transaction submitted (${pending.params.signature}). Do not trade again. Retry confirmation or check Solana Explorer. ${lastError instanceof Error ? lastError.message : ''}`);
    return null;
  }, [pendingKey, pendingStorageKey]);

  const execute = useCallback(
    async (side: TradeSide, amountUsd: number, quote: import("@/types/market").ExecutionQuote) => {
      if (!account) {
        setError('Connect your wallet first.');
        setState('error');
        return null;
      }
      if (busy.current) return null;
      const releaseSubmission = acquireSubmission(pendingKey);
      if (!releaseSubmission) {
        setError('This trade is already being processed in another screen.');
        return null;
      }
      busy.current = true;
      setError(null);
      setReceipt(null);
      try {
        if (!pendingExecutions.has(pendingKey)) {
          const pending = await SecureStore.getItemAsync(pendingStorageKey);
          if (pending) pendingExecutions.set(pendingKey, JSON.parse(pending) as PendingExecution);
        }
        if (pendingExecutions.has(pendingKey)) return await confirmPending();
        setState('building');
        const built = await marketApi.buildExecutionTransaction(marketId, side, amountUsd, account.address);
        setState('awaiting-signature');
        if (!built.executionIntent || built.network !== 'mainnet-beta') throw new Error('Backend needs the security update before trading.');
        const venue = quote.venueQuotes.find(row => row.best);
        if (!venue || !market.baseMint || !market.quoteMint || market.baseDecimals === undefined || market.quoteDecimals === undefined) throw new Error('Analyze this trade again before signing.');
        const signature = await signAndSendTransaction(built.transactionBase64, {
          walletAddress: account.address,
          inputMint: side === 'buy' ? market.quoteMint : market.baseMint,
          outputMint: side === 'buy' ? market.baseMint : market.quoteMint,
          inputDecimals: side === 'buy' ? market.quoteDecimals : market.baseDecimals,
          outputDecimals: side === 'buy' ? market.baseDecimals : market.quoteDecimals,
          maxInput: side === 'buy' ? amountUsd : venue.expectedBase,
          minOutput: (side === 'buy' ? venue.expectedBase : venue.expectedQuote) * 0.978,
        });
        pendingExecutions.set(pendingKey, { marketId, params: {
          signature, executionIntent: built.executionIntent, network: built.network,
          side, amountUsd, userPublicKey: account.address,
        } });
        await SecureStore.setItemAsync(pendingStorageKey, JSON.stringify(pendingExecutions.get(pendingKey)));
        return await confirmPending();
      } catch (err) {
        setError(pendingExecutions.has(pendingKey) ? `Transaction already submitted. Retry confirmation; do not submit another trade. ${err instanceof Error ? err.message : ''}` : err instanceof Error ? err.message : 'Could not execute this order.');
        setState(pendingExecutions.has(pendingKey) ? 'pending-confirmation' : 'error');
        return null;
      } finally { busy.current = false; releaseSubmission(); }
    },
    [market, marketId, account, signAndSendTransaction, pendingKey, pendingStorageKey, confirmPending]
  );

  const reset = useCallback(() => {
    setState(pendingExecutions.has(pendingKey) ? 'pending-confirmation' : 'idle');
    setReceipt(null);
    setError(null);
  }, [pendingKey]);

  // Drops a stuck pending trade that retrying can never resolve -- a confirm that will always be
  // rejected server-side (for example, an execution ticket issued before a verification-rule change).
  // This only clears Searix's own local record of it; it never touches, and cannot undo, anything
  // already on-chain. The caller's UI must tell the person to check Solana Explorer first.
  const discardPending = useCallback(async () => {
    pendingExecutions.delete(pendingKey);
    await SecureStore.deleteItemAsync(pendingStorageKey).catch(() => undefined);
    setError(null);
    setReceipt(null);
    setState('idle');
  }, [pendingKey, pendingStorageKey]);

  return { state, receipt, error, network, account, execute, reset, discardPending };
}

export function usePlatformInfo() {
  const [fees, setFees] = useState<Resource<FeesConfig | null>>({ data: null, error: null, loading: true });
  const [revenue, setRevenue] = useState<Resource<RevenueSummary | null>>({ data: null, error: null, loading: true });

  const load = useCallback(async () => {
    setFees((current) => ({ ...current, error: null, loading: current.data === null }));
    setRevenue((current) => ({ ...current, error: null, loading: current.data === null }));
    try {
      const [feesConfig, revenueSummary] = await Promise.all([marketApi.feesConfig(), marketApi.revenueSummary()]);
      setFees({ data: feesConfig, error: null, loading: false });
      setRevenue({ data: revenueSummary, error: null, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Couldn’t load platform info.';
      setFees((current) => ({ ...current, error: message, loading: false }));
      setRevenue((current) => ({ ...current, error: message, loading: false }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { fees, revenue, retry: load };
}
