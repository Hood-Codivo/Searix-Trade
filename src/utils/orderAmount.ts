// The legacy amountUsd API parameter represents quote-token units.
export function toQuoteAmount(side: 'buy' | 'sell', input: number, bid: number | undefined, quoteSymbol: string): number {
  if (!Number.isFinite(input) || input <= 0) throw new Error('Enter a positive token amount.');
  if (side === 'sell' && (!bid || !Number.isFinite(bid) || bid <= 0)) {
    throw new Error('No live sell price is available. Try again when the order book refreshes.');
  }
  const amount = side === 'buy' ? input : input * bid!;
  if (!Number.isFinite(amount) || amount < 1 || amount > 1_000_000) {
    throw new Error(`Order value must be between 1 and 1,000,000 ${quoteSymbol}.`);
  }
  return amount;
}
