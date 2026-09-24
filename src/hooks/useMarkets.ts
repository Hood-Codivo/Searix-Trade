import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletProvider';
import { marketApi } from '@/services/api';
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
  const [resource, setResource] = useState<Resource<ExecutionReceipt[]>>({ data: [], error: null, loading: true });
  // `load` keeps a stable identity (empty deps) so screens can safely re-run it on focus
  // (e.g. via useFocusEffect) without re-subscribing on every render.
  const load = useCallback(async () => {
    setResource((current) => ({ ...current, error: null, loading: current.data.length === 0 }));
    try {
      const data = await marketApi.listReceipts();
      setResource({ data, error: null, loading: false });
    } catch (error) {
      setResource((current) => ({ ...current, error: error instanceof Error ? error.message : 'Couldn’t load your receipts.', loading: false }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...resource, retry: load };
}

export function useAlerts() {
  const [resource, setResource] = useState<Resource<Alert[]>>({ data: [], error: null, loading: true });
  const load = useCallback(async () => {
    setResource((current) => ({ ...current, error: null, loading: current.data.length === 0 }));
    try {
      const data = await marketApi.listAlerts();
      setResource({ data, error: null, loading: false });
    } catch (error) {
      setResource((current) => ({ ...current, error: error instanceof Error ? error.message : 'Couldn’t load alerts.', loading: false }));
    }
  }, []);

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

export type ExecuteOrderState = 'idle' | 'building' | 'awaiting-signature' | 'confirming' | 'executed' | 'error';

// Orchestrates the real execute flow: build an unsigned transaction on the backend, sign + submit
// it via the user's own wallet (never the backend), then ask the backend to verify it on-chain
// before treating it as a real receipt.
export function useExecuteOrder(marketId: string) {
  const { account, network, signAndSendTransaction } = useWallet();
  const [state, setState] = useState<ExecuteOrderState>('idle');
  const [receipt, setReceipt] = useState<ExecutionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (side: TradeSide, amountUsd: number) => {
      if (!account) {
        setError('Connect your wallet first.');
        setState('error');
        return null;
      }
      setError(null);
      setReceipt(null);
      try {
        setState('building');
        const built = await marketApi.buildExecutionTransaction(marketId, side, amountUsd, account.address);
        setState('awaiting-signature');
        const signature = await signAndSendTransaction(built.transactionBase64);
        setState('confirming');
        const saved = await marketApi.confirmExecution(marketId, {
          signature,
          network: built.network,
          side,
          amountUsd,
          userPublicKey: account.address,
        });
        setReceipt(saved);
        setState('executed');
        return saved;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not execute this order.');
        setState('error');
        return null;
      }
    },
    [marketId, account, signAndSendTransaction]
  );

  const reset = useCallback(() => {
    setState('idle');
    setReceipt(null);
    setError(null);
  }, []);

  return { state, receipt, error, network, account, execute, reset };
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
