import type { Market } from '@/types/market';

// Where tapping a holding should go: that asset's market, with sell already selected.
// Returns null when no market in the list trades the asset, so the caller can say so instead of guessing.
export function sellRouteFor(markets: Market[], { mint, symbol }: { mint?: string; symbol?: string }): string | null {
  const market = markets.find((item) => (mint && item.baseMint === mint) || (symbol && item.base === symbol && item.quote === 'USDC'));
  return market ? `/market/${market.id}?side=sell` : null;
}
