import type {
  Alert,
  AlertRule,
  PositionPnl,
  WalletBalances,
  WalletHolding,
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

if (!__DEV__ && !apiUrl.startsWith('https://')) throw new Error('Production API URL must use HTTPS.');

export type ApiSession = { token: string; walletAddress: string; expiresAt: number };
let apiSession: ApiSession | null = null;
export function setApiSession(session: ApiSession | null) { apiSession = session; }
export function hasApiSession() { return Boolean(apiSession && apiSession.expiresAt > Date.now()); }
export async function authenticateApiWallet(walletAddress: string, sign: (message: string) => Promise<string>) {
  const challenge = await request<{ nonce: string; message: string }>('/v1/auth/challenge', { method: 'POST', body: JSON.stringify({ walletAddress }) });
  // Only sign our narrowly defined login messages, never arbitrary API-supplied bytes.
  const expectedPrefix = `Searix Trade wallet sign-in\nWallet: ${walletAddress}\nNonce: ${challenge.nonce}\nExpires: `;
  if (!/^[a-f0-9]{64}$/.test(challenge.nonce) || !challenge.message.startsWith(expectedPrefix) ||
      !challenge.message.endsWith('\nThis message authenticates your account. It does not authorize a transaction.') || challenge.message.length > 600) {
    throw new Error('The server returned an invalid wallet sign-in challenge.');
  }
  const signature = await sign(challenge.message);
  const session = await request<ApiSession>('/v1/auth/session', { method: 'POST', body: JSON.stringify({ nonce: challenge.nonce, signature }) });
  if (session.walletAddress !== walletAddress) throw new Error('Wallet session mismatch.');
  setApiSession(session); return session;
}
export async function revokeApiSession() {
  try { if (apiSession) await request('/v1/auth/session', { method: 'DELETE' }); }
  finally { setApiSession(null); }
}

type ApiResponse<T> = { data: T };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  else init.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 20_000);
  let response: Response;
  try { response = await fetch(`${apiUrl}${path}`, {
    ...init,
    signal: controller.signal,
    // Only declare a JSON content type when there's actually a body. Sending it on a bodyless request
    // (e.g. a DELETE with nothing to send) makes the server try to JSON-parse an empty string and fail
    // with an unrelated-looking error -- declaring a content type for content that doesn't exist.
    headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(apiSession ? { Authorization: `Bearer ${apiSession.token}` } : {}), ...init.headers },
  }); } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
  }
  if (!response.ok) {
    if (response.status === 401) { setApiSession(null); throw new Error("Wallet sign-in expired. Disconnect and reconnect your wallet."); }
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
    hasApiSession() ? request<ExecutionReceipt[]>("/v1/execution-receipts", { signal }) : Promise.resolve([] as ExecutionReceipt[]),
  walletExecutions: (address: string, signal?: AbortSignal) =>
    request<ExecutionReceipt[]>(`/v1/wallets/${encodeURIComponent(address)}/executions`, { signal }),
  walletBalances: (address: string, signal?: AbortSignal) =>
    request<WalletBalances>(`/v1/wallets/${encodeURIComponent(address)}/balances`, { signal }),
  walletPnl: (address: string, signal?: AbortSignal) =>
    request<PositionPnl[]>(`/v1/wallets/${encodeURIComponent(address)}/pnl`, { signal }),
  walletHoldings: (address: string, signal?: AbortSignal) =>
    request<WalletHolding[]>(`/v1/wallets/${encodeURIComponent(address)}/holdings`, { signal }),
  buildExecutionTransaction: (id: string, side: TradeSide, amountUsd: number, userPublicKey: string) =>
    request<BuiltExecutionTransaction>(`/v1/markets/${encodeURIComponent(id)}/execution-transaction`, {
      method: "POST",
      body: JSON.stringify({ side, amountUsd, userPublicKey }),
    }),
  confirmExecution: (
    id: string,
    params: { executionIntent: string; signature: string; network: ExecutionNetwork; side: TradeSide; amountUsd: number; userPublicKey: string },
  ) =>
    request<ExecutionReceipt>(`/v1/markets/${encodeURIComponent(id)}/execution-confirm`, {
      method: "POST",
      body: JSON.stringify(params),
    }),
  revenueSummary: (signal?: AbortSignal) =>
    request<RevenueSummary>("/v1/revenue/summary", { signal }),
  feesConfig: (signal?: AbortSignal) =>
    request<FeesConfig>("/v1/fees/config", { signal }),
  // Market-wide alerts, plus this wallet's own rule alerts when a wallet is given.
  listAlerts: (wallet?: string, signal?: AbortSignal) =>
    request<Alert[]>(wallet ? `/v1/alerts?wallet=${encodeURIComponent(wallet)}` : "/v1/alerts", { signal }),
  listAlertRules: (wallet: string, signal?: AbortSignal) =>
    request<AlertRule[]>(`/v1/alert-rules?wallet=${encodeURIComponent(wallet)}`, { signal }),
  createAlertRule: (rule: { walletAddress: string; marketId: string; kind: "price" | "premium"; direction: "above" | "below"; threshold: number }) =>
    request<AlertRule>("/v1/alert-rules", { method: "POST", body: JSON.stringify(rule) }),
  deleteAlertRule: (id: string, wallet: string) =>
    request<{ removed: true }>(`/v1/alert-rules/${encodeURIComponent(id)}?wallet=${encodeURIComponent(wallet)}`, { method: "DELETE" }),
  registerPushToken: (wallet: string, token: string) =>
    request<{ registered: boolean }>(`/v1/wallets/${encodeURIComponent(wallet)}/push-token`, { method: 'POST', body: JSON.stringify({ token }) }),
  unregisterPushToken: (wallet: string) =>
    request<{ registered: boolean }>(`/v1/wallets/${encodeURIComponent(wallet)}/push-token`, { method: 'DELETE' }),
  pushTokenStatus: (wallet: string, signal?: AbortSignal) =>
    request<{ registered: boolean }>(`/v1/wallets/${encodeURIComponent(wallet)}/push-token`, { signal }),
  registryEntry: (symbol: string, signal?: AbortSignal) =>
    request<AssetRegistryEntry>(`/v1/registry/${encodeURIComponent(symbol)}`, { signal }),
};

export { apiUrl };
