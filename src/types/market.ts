export type QualityTone = 'clean' | 'watch' | 'caution';

export type OrderLevel = {
  price: number;
  size: number;
};

export type Market = {
  id: string;
  base: string;
  quote: string;
  venue: 'Phoenix';
  price: number;
  change24h: number;
  volume24h: number;
  spreadBps: number;
  depthUsd: number;
  imbalance: number;
  quality: {
    label: string;
    tone: QualityTone;
    summary: string;
    score: number;
  };
  bids: OrderLevel[];
  asks: OrderLevel[];
  candles: number[];
  sequence?: number;
  observedAt?: string;
  assetClass?: 'crypto' | 'tokenized-stock';
  underlyingSymbol?: string;
  baseMint?: string;
  quoteMint?: string;
  baseDecimals?: number;
  quoteDecimals?: number;
  reference?: {
    source: 'Jupiter';
    underlyingFeed: string;
    tokenFeed: string;
    underlyingPrice: number;
    tokenPrice: number;
    premiumBps: number;
    marketState: 'open' | 'closed';
    isLive: boolean;
    observedAt: string;
  };
  pyth?: {
    source: 'Pyth';
    equityPrice: number | null;
    tokenPrice: number | null;
    redemptionRate: number | null;
    premiumBps: number | null;
    isLive: boolean;
    unavailableReason: 'entitlement_pending' | 'unavailable' | null;
    observedAt: string;
  };
};

export type CandleRange = '1h' | '1d' | '1w' | '1m';

export type MarketCandles = {
  marketId: string;
  range: CandleRange;
  values: number[];
  observedAt: string;
};

export type TradeSide = 'buy' | 'sell';

export type ExecutionQuote = {
  marketId: string;
  side: TradeSide;
  requestedUsd: number;
  filledUsd: number;
  fillPercent: number;
  averagePrice: number;
  referencePrice: number;
  priceImpactBps: number;
  spreadBps: number;
  feeUsd: number;
  feeBreakdown: {
    venueFeeUsd: number;
    phoenixFeeUsd: number;
    phoenixFeeBps: number;
    collectionEnabled: boolean;
    status: 'preview' | 'collectible';
  };
  totalUsd: number;
  levelsConsumed: number;
  safeSizeUsd: number;
  qualityScore: number;
  qualityLabel: 'Efficient' | 'Acceptable' | 'Expensive';
  warning: string | null;
  explanation: string;
  observedAt: string;
  venueQuotes: Array<{
    venue: 'Phoenix' | 'Jupiter';
    averagePrice: number;
    priceImpactBps: number;
    estimatedTotalUsd: number;
    best: boolean;
    isLive: boolean;
  }>;
};

export type ExecutionNetwork = 'devnet' | 'mainnet-beta';

export type ExecutionReceipt = {
  id: string;
  createdAt: string;
  marketId: string;
  symbol: string;
  side: TradeSide;
  requestedUsd: number;
  expectedAveragePrice: number;
  expectedImpactBps: number;
  qualityScore: number;
  bestVenue: string;
  benchmarkPrice: number | null;
  premiumBps: number | null;
  verified: boolean;
  transactionSignature: string | null;
  status: 'analysis' | 'executed' | 'failed';
  network: ExecutionNetwork | null;
  actualAveragePrice: number | null;
  actualFilledUsd: number | null;
  phoenixFeeUsd: number;
  phoenixFeeBps: number;
  feeStatus: 'projected' | 'collected';
  contentHash: string;
};

export type BuiltExecutionTransaction = {
  transactionBase64: string;
  lastValidBlockHeight: number;
  network: ExecutionNetwork;
  kind: 'devnet-probe' | 'jupiter-swap';
};

export type FeesConfig = {
  standardFeeBps: number;
  proFeeBps: number;
  collectionEnabled: boolean;
  treasuryConfigured: boolean;
};

export type RevenueSummary = {
  currency: 'USD';
  receiptCount: number;
  projectedRevenueUsd: number;
  collectedRevenueUsd: number;
  collectionEnabled: boolean;
};

export type AlertSeverity = 'watch' | 'warning';

export type Alert = {
  id: string;
  marketId: string;
  symbol: string;
  kind: 'premium-deterioration';
  severity: AlertSeverity;
  premiumBps: number;
  thresholdBps: number;
  message: string;
  createdAt: string;
};

export type AssetRegistryEntry = {
  symbol: string;
  name: string;
  underlyingSymbol: string;
  mint: string;
  tokenProgram: string;
  issuer: string;
  custody: string;
  backingRatio: string;
  redemption: string;
  jurisdictionRestrictions: string;
  regulatoryFramework: string;
  tradingVenues: string[];
  sources: { label: string; url: string }[];
};
