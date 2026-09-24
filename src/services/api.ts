import type {
  Alert,
  AssetRegistryEntry,
  BuiltExecutionTransaction,
  CandleRange,
  ExecutionNetwork,
  ExecutionQuote,
  ExecutionReceipt,
  FeesConfig,
  Market,
  MarketCandles,
  RevenueSummary,
  TradeSide,
} from "@/types/market";

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? "https://clob-backend.onrender.com";

type ApiResponse<T> = { data: T };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const body = await response
      .json()
      .then((json) => json as { error?: { code?: string; message?: string } })
      .catch(() => undefined);
    const fallback =
      response.status === 404
        ? "That market is not being tracked."
        : "Market data is temporarily unavailable.";
    throw new Error(body?.error?.message ?? fallback);
  }
  return ((await response.json()) as ApiResponse<T>).data;
}

export const marketApi = {
  list: (signal?: AbortSignal) => request<Market[]>("/v1/markets", { signal }),
  get: (id: string, signal?: AbortSignal) =>
    request<Market>(`/v1/markets/${encodeURIComponent(id)}`, { signal }),
  candles: (id: string, range: CandleRange, signal?: AbortSignal) =>
    request<MarketCandles>(
      `/v1/markets/${encodeURIComponent(id)}/candles?range=${range}`,
      { signal },
    ),
  quoteExecution: (id: string, side: TradeSide, amountUsd: number, signal?: AbortSignal) =>
    request<ExecutionQuote>(`/v1/markets/${encodeURIComponent(id)}/execution-quote`, {
      method: "POST",
      body: JSON.stringify({ side, amountUsd }),
      signal,
    }),
  saveReceipt: (id: string, side: TradeSide, amountUsd: number) =>
    request<ExecutionReceipt>(`/v1/markets/${encodeURIComponent(id)}/execution-receipts`, {
      method: "POST",
      body: JSON.stringify({ side, amountUsd }),
    }),
  listReceipts: (signal?: AbortSignal) =>
    request<ExecutionReceipt[]>("/v1/execution-receipts", { signal }),
  buildExecutionTransaction: (id: string, side: TradeSide, amountUsd: number, userPublicKey: string) =>
    request<BuiltExecutionTransaction>(`/v1/markets/${encodeURIComponent(id)}/execution-transaction`, {
      method: "POST",
      body: JSON.stringify({ side, amountUsd, userPublicKey }),
    }),
  confirmExecution: (
    id: string,
    params: { signature: string; network: ExecutionNetwork; side: TradeSide; amountUsd: number; userPublicKey: string },
  ) =>
    request<ExecutionReceipt>(`/v1/markets/${encodeURIComponent(id)}/execution-confirm`, {
      method: "POST",
      body: JSON.stringify(params),
    }),
  revenueSummary: (signal?: AbortSignal) =>
    request<RevenueSummary>("/v1/revenue/summary", { signal }),
  feesConfig: (signal?: AbortSignal) =>
    request<FeesConfig>("/v1/fees/config", { signal }),
  listAlerts: (signal?: AbortSignal) => request<Alert[]>("/v1/alerts", { signal }),
  registryEntry: (symbol: string, signal?: AbortSignal) =>
    request<AssetRegistryEntry>(`/v1/registry/${encodeURIComponent(symbol)}`, { signal }),
};

export { apiUrl };
