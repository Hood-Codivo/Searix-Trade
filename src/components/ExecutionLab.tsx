import { useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Building2, Calculator, Check, ExternalLink, FileCheck2, FileText, Gauge, Layers3, ShieldAlert, Wallet } from 'lucide-react-native';
import { useWallet } from '@/context/WalletProvider';
import { useExecuteOrder } from '@/hooks/useMarkets';
import { marketApi } from '@/services/api';
import { colors, font, radius, shadow, spacing } from '@/theme';
import type { ExecutionNetwork, ExecutionQuote, Market, TradeSide } from '@/types/market';
import { formatCompactUsd, formatPrice } from '@/utils/format';

const presets = [250, 1_000, 5_000, 25_000];

function explorerUrl(signature: string, network: ExecutionNetwork): string {
  return network === 'devnet'
    ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    : `https://explorer.solana.com/tx/${signature}`;
}

const signLabels: Record<string, string> = {
  building: 'Building transaction…',
  'awaiting-signature': 'Waiting for wallet…',
  confirming: 'Confirming on-chain…',
};

export function ExecutionLab({ market }: { market: Market }) {
  const { account, network, connect } = useWallet();
  const execOrder = useExecuteOrder(market.id);
  const [side, setSide] = useState<TradeSide>('buy');
  const [amount, setAmount] = useState('1000');
  const [quote, setQuote] = useState<ExecutionQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedReceiptId, setSavedReceiptId] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const parsedAmount = useMemo(() => Number(amount.replace(/,/g, '')), [amount]);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount >= 1 && parsedAmount <= 1_000_000;

  const analyze = async () => {
    if (!validAmount) {
      setError('Enter an amount from $1 to $1,000,000.');
      return;
    }
    controller.current?.abort();
    controller.current = new AbortController();
    setLoading(true);
    setError(null);
    setSavedReceiptId(null);
    setPreviewing(false);
    execOrder.reset();
    try {
      setQuote(await marketApi.quoteExecution(market.id, side, parsedAmount, controller.current.signal));
    } catch (reason) {
      if ((reason as Error).name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'Couldn’t analyze this order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveReceipt = async () => {
    if (!quote) return;
    setSaving(true);
    setError(null);
    try {
      const receipt = await marketApi.saveReceipt(market.id, side, quote.requestedUsd);
      setSavedReceiptId(receipt.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Couldn’t save this analysis. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const chooseSide = (next: TradeSide) => {
    setSide(next);
    setQuote(null);
    setSavedReceiptId(null);
    setPreviewing(false);
    setError(null);
    execOrder.reset();
  };

  return (
    <View style={styles.lab}>
      <View style={styles.headingLine}>
        <View style={styles.iconWell}><Gauge color={colors.amber} size={20} /></View>
        <View style={styles.headingCopy}><Text style={styles.eyebrow}>EXECUTION INTELLIGENCE</Text><Text style={styles.title}>Pre-Trade Check</Text></View>
        <View style={styles.previewPill}><View style={styles.previewDot} /><Text style={styles.previewText}>Preview</Text></View>
      </View>
      <Text style={styles.intro}>See how much liquidity your order consumes before opening your wallet.</Text>

      {market.reference ? (
        <View style={styles.referenceCard}>
          <View style={styles.referenceHeading}><Building2 color={colors.blue} size={17} /><Text style={styles.referenceTitle}>{market.underlyingSymbol} equity benchmark</Text><View style={[styles.sourcePill, !market.reference.isLive && styles.sourcePillPreview]}><Text style={styles.sourceText}>{market.reference.isLive ? 'LIVE JUPITER' : 'JUPITER PREVIEW'}</Text></View></View>
          <View style={styles.referenceValues}><View><Text style={styles.referenceLabel}>Underlying</Text><Text style={styles.referenceValue}>${formatPrice(market.reference.underlyingPrice)}</Text></View><View><Text style={styles.referenceLabel}>Token</Text><Text style={styles.referenceValue}>${formatPrice(market.reference.tokenPrice)}</Text></View><View><Text style={styles.referenceLabel}>Token premium</Text><Text style={[styles.referenceValue, { color: market.reference.premiumBps >= 0 ? colors.amber : colors.green }]}>{market.reference.premiumBps >= 0 ? '+' : ''}{market.reference.premiumBps.toFixed(1)} bps</Text></View></View>
          <Text style={styles.referenceFoot}>{market.reference.underlyingFeed} vs {market.reference.tokenFeed} · US market {market.reference.marketState}</Text>
        </View>
      ) : null}

      {market.pyth ? (
        <View style={styles.referenceCard}>
          <View style={styles.referenceHeading}>
            <Building2 color={colors.blue} size={17} />
            <Text style={styles.referenceTitle}>{market.underlyingSymbol} · Pyth cross-check</Text>
            <View style={[styles.sourcePill, !market.pyth.isLive && styles.sourcePillPreview]}>
              <Text style={styles.sourceText}>{market.pyth.isLive ? 'LIVE PYTH' : 'PENDING PYTH ACCESS'}</Text>
            </View>
          </View>
          {market.pyth.isLive ? (
            <>
              <View style={styles.referenceValues}>
                <View><Text style={styles.referenceLabel}>Underlying</Text><Text style={styles.referenceValue}>${formatPrice(market.pyth.equityPrice ?? 0)}</Text></View>
                <View><Text style={styles.referenceLabel}>Token</Text><Text style={styles.referenceValue}>${formatPrice(market.pyth.tokenPrice ?? 0)}</Text></View>
                <View><Text style={styles.referenceLabel}>Token premium</Text><Text style={[styles.referenceValue, { color: (market.pyth.premiumBps ?? 0) >= 0 ? colors.amber : colors.green }]}>{(market.pyth.premiumBps ?? 0) >= 0 ? '+' : ''}{(market.pyth.premiumBps ?? 0).toFixed(1)} bps</Text></View>
              </View>
              <Text style={styles.referenceFoot}>Independent second source, cross-checked against the Jupiter benchmark above.</Text>
            </>
          ) : (
            <Text style={styles.referenceFoot}>Feed wiring is live; Pyth's equity/xStock data grant for this hackathon is still pending approval. This card goes live automatically once it's granted — no fabricated numbers shown in the meantime.</Text>
          )}
        </View>
      ) : null}

      <View accessibilityRole="tablist" style={styles.sideSwitch}>
        {(['buy', 'sell'] as TradeSide[]).map((value) => (
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: side === value }} key={value} onPress={() => chooseSide(value)} style={({ pressed }) => [styles.sideButton, side === value && (value === 'buy' ? styles.buyActive : styles.sellActive), pressed && styles.pressed]}>
            <Text style={[styles.sideText, side === value && styles.sideTextActive]}>{value === 'buy' ? 'Buy' : 'Sell'} {market.base}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Order value</Text>
      <View style={[styles.amountField, error && !validAmount && styles.amountFieldError]}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          accessibilityLabel="Order value in US dollars"
          keyboardType="decimal-pad"
          onChangeText={(value) => { setAmount(value.replace(/[^0-9.,]/g, '')); setQuote(null); setSavedReceiptId(null); setPreviewing(false); setError(null); execOrder.reset(); }}
          onSubmitEditing={() => void analyze()}
          placeholder="1,000"
          placeholderTextColor={colors.textSubtle}
          returnKeyType="done"
          style={styles.input}
          value={amount}
        />
        <Text style={styles.currencyCode}>USD</Text>
      </View>
      <View style={styles.presets}>{presets.map((value) => <Pressable accessibilityLabel={`Set order value to ${value} dollars`} key={value} onPress={() => { setAmount(String(value)); setQuote(null); setSavedReceiptId(null); setError(null); execOrder.reset(); }} style={({ pressed }) => [styles.preset, pressed && styles.pressed]}><Text style={styles.presetText}>{formatCompactUsd(value)}</Text></Pressable>)}</View>
      {error ? <View accessibilityLiveRegion="polite" style={styles.inlineError}><ShieldAlert color={colors.red} size={17} /><Text style={styles.inlineErrorText}>{error}</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ busy: loading, disabled: loading }} disabled={loading} onPress={() => void analyze()} style={({ pressed }) => [styles.analyzeButton, pressed && styles.pressed, loading && styles.disabled]}>
        {loading ? <ActivityIndicator color={colors.canvas} size="small" /> : <Calculator color={colors.canvas} size={18} />}
        <Text style={styles.analyzeText}>{loading ? 'Checking liquidity…' : 'Analyze this order'}</Text>
      </Pressable>

      {quote ? (
        <View accessibilityLiveRegion="polite" style={styles.result}>
          <View style={styles.scoreLine}>
            <View><Text style={styles.resultLabel}>ESTIMATED FILL QUALITY</Text><Text style={styles.score}>{quote.qualityScore}<Text style={styles.scoreOutOf}>/100</Text></Text></View>
            <View style={[styles.qualityPill, quote.qualityLabel === 'Expensive' && styles.qualityPillRisk]}><Check color={quote.qualityLabel === 'Expensive' ? colors.red : colors.green} size={15} /><Text style={[styles.qualityText, quote.qualityLabel === 'Expensive' && styles.qualityTextRisk]}>{quote.qualityLabel}</Text></View>
          </View>
          <View style={styles.metricGrid}>
            <ResultMetric label="Average fill" value={formatPrice(quote.averagePrice)} />
            <ResultMetric label="Price impact" value={`${quote.priceImpactBps.toFixed(1)} bps`} />
            <ResultMetric label="Book levels" value={String(quote.levelsConsumed)} />
            <ResultMetric label="Venue fee" value={`$${quote.feeBreakdown.venueFeeUsd.toFixed(2)}`} />
          </View>
          <View style={styles.feeCard}>
            <View style={styles.feeHeading}><Text style={styles.aiTitle}>Transparent fee breakdown</Text><View style={styles.feePill}><Text style={styles.feePillText}>{quote.feeBreakdown.status === 'preview' ? 'PREVIEW' : 'ENABLED'}</Text></View></View>
            <View style={styles.feeRow}><Text style={styles.orderKey}>Searix platform fee</Text><Text style={styles.orderValue}>${quote.feeBreakdown.phoenixFeeUsd.toFixed(2)} · {quote.feeBreakdown.phoenixFeeBps} bps</Text></View>
            <View style={styles.feeRow}><Text style={styles.orderKey}>Venue fee</Text><Text style={styles.orderValue}>${quote.feeBreakdown.venueFeeUsd.toFixed(2)}</Text></View>
            <Text style={styles.feeDisclosure}>{quote.feeBreakdown.collectionEnabled ? 'Collected only when a wallet-signed trade succeeds.' : 'No Searix fee is currently collected on real, wallet-signed trades.'}</Text>
          </View>
          <View style={styles.venueCard}>
            <View style={styles.aiHeading}><Building2 color={colors.blue} size={17} /><Text style={styles.aiTitle}>Venue comparison</Text></View>
            <Text style={styles.venueDisclosure}>Phoenix quotes the live order book. The Jupiter row, when shown, is a real routed quote fetched from Jupiter's aggregator for this same trade — not an estimate.</Text>
            {quote.venueQuotes.map((venue) => <View key={venue.venue} style={styles.venueRow}><View style={styles.venueNameLine}><Text style={styles.venueName}>{venue.venue}</Text><Text style={[styles.venueMode, venue.isLive && styles.venueModeLive]}>{venue.isLive ? 'LIVE' : 'UNAVAILABLE'}</Text></View><Text style={styles.venueMetric}>{venue.priceImpactBps.toFixed(1)} bps</Text>{venue.best ? <View style={styles.bestPill}><Text style={styles.bestText}>BEST</Text></View> : <View style={styles.bestSpacer} />}</View>)}
          </View>
          <View style={styles.liquidityLine}><Layers3 color={colors.blue} size={17} /><Text style={styles.liquidityCopy}>Up to <Text style={styles.liquidityStrong}>{formatCompactUsd(quote.safeSizeUsd)}</Text> is visible inside your 25 bps liquidity budget.</Text></View>
          {quote.warning ? <View style={styles.warning}><ShieldAlert color={colors.amber} size={17} /><Text style={styles.warningText}>{quote.warning}</Text></View> : null}
          <View style={styles.aiCard}><View style={styles.aiHeading}><FileText color={colors.amber} size={17} /><Text style={styles.aiTitle}>Searix explanation</Text></View><Text style={styles.aiCopy}>{quote.explanation}</Text><Text style={styles.aiEvidence}>Based on sequence {market.sequence ?? '—'} · {new Date(quote.observedAt).toLocaleTimeString()}</Text></View>
          <Pressable accessibilityRole="button" accessibilityState={{ busy: saving, disabled: saving || Boolean(savedReceiptId) }} disabled={saving || Boolean(savedReceiptId)} onPress={() => void saveReceipt()} style={({ pressed }) => [styles.receiptButton, pressed && styles.pressed, (saving || savedReceiptId) && styles.receiptButtonSaved]}>{savedReceiptId ? <Check color={colors.green} size={17} /> : <FileCheck2 color={colors.text} size={17} />}<Text style={[styles.receiptButtonText, savedReceiptId && styles.receiptButtonTextSaved]}>{saving ? 'Saving analysis…' : savedReceiptId ? 'Analysis receipt saved' : 'Save analysis receipt'}</Text></Pressable>
          {savedReceiptId ? <><Text style={styles.receiptId}>Unverified receipt · {savedReceiptId}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/receipts')} style={({ pressed }) => [styles.viewReceiptsButton, pressed && styles.pressed]}><Text style={styles.viewReceiptsText}>View receipt history</Text></Pressable></> : null}
          {!previewing ? (
            <Pressable accessibilityRole="button" onPress={() => setPreviewing(true)} style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}><Text style={styles.previewButtonText}>Preview {side} order</Text></Pressable>
          ) : (
            <View style={styles.orderPreview}>
              <View style={styles.orderPreviewHeading}>
                <Text style={styles.orderPreviewEyebrow}>SIGNING PREVIEW</Text>
                <View style={[styles.networkPill, network === 'mainnet-beta' && styles.networkPillMainnet]}>
                  <Text style={styles.networkPillText}>{network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET'}</Text>
                </View>
              </View>
              <View style={styles.orderRow}><Text style={styles.orderKey}>Order</Text><Text style={styles.orderValue}>{side === 'buy' ? 'Buy' : 'Sell'} {market.base} · ${quote.requestedUsd.toLocaleString()}</Text></View>
              <View style={styles.orderRow}><Text style={styles.orderKey}>Expected result</Text><Text style={styles.orderValue}>{quote.fillPercent.toFixed(1)}% visible · ${quote.totalUsd.toLocaleString()}</Text></View>
              <View style={styles.orderRow}><Text style={styles.orderKey}>Searix fee</Text><Text style={styles.orderValue}>${quote.feeBreakdown.phoenixFeeUsd.toFixed(2)} ({quote.feeBreakdown.phoenixFeeBps} bps)</Text></View>

              {execOrder.state === 'executed' && execOrder.receipt?.transactionSignature ? (
                <View style={styles.executedCard}>
                  <Check color={colors.green} size={18} />
                  <View style={styles.executedCopy}>
                    <Text style={styles.executedTitle}>{execOrder.receipt.network === 'devnet' ? 'Devnet pipeline verified on-chain' : 'Order executed and verified on-chain'}</Text>
                    <Text style={styles.executedSignature}>{execOrder.receipt.transactionSignature}</Text>
                    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(explorerUrl(execOrder.receipt!.transactionSignature!, execOrder.receipt!.network!))} style={({ pressed }) => [styles.explorerLink, pressed && styles.pressed]}>
                      <ExternalLink color={colors.blue} size={13} /><Text style={styles.explorerLinkText}>View on Solana Explorer</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.orderNotice}>
                    {network === 'devnet'
                      ? 'Devnet mode: this signs and submits a trivial self-transfer to prove the sign → submit → confirm pipeline works. It is not a real trade.'
                      : 'This builds a real Jupiter swap transaction on Solana mainnet. Signing it moves real funds.'}
                  </Text>
                  {execOrder.error ? <View style={styles.inlineError}><ShieldAlert color={colors.red} size={17} /><Text style={styles.inlineErrorText}>{execOrder.error}</Text></View> : null}
                  {!account ? (
                    <Pressable accessibilityRole="button" onPress={() => void connect()} style={({ pressed }) => [styles.walletButton, styles.walletButtonActive, pressed && styles.pressed]}>
                      <Wallet color={colors.canvas} size={16} /><Text style={styles.walletButtonActiveText}>Connect wallet</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ busy: execOrder.state === 'building' || execOrder.state === 'awaiting-signature' || execOrder.state === 'confirming' }}
                      disabled={execOrder.state === 'building' || execOrder.state === 'awaiting-signature' || execOrder.state === 'confirming'}
                      onPress={() => void execOrder.execute(side, quote.requestedUsd)}
                      style={({ pressed }) => [styles.walletButton, styles.walletButtonActive, pressed && styles.pressed]}
                    >
                      {execOrder.state === 'building' || execOrder.state === 'awaiting-signature' || execOrder.state === 'confirming'
                        ? <ActivityIndicator color={colors.canvas} size="small" />
                        : <Wallet color={colors.canvas} size={16} />}
                      <Text style={styles.walletButtonActiveText}>{signLabels[execOrder.state] ?? 'Sign & Submit'}</Text>
                    </Pressable>
                  )}
                </>
              )}
              <Pressable accessibilityRole="button" onPress={() => { setPreviewing(false); execOrder.reset(); }} style={styles.cancelButton}><Text style={styles.cancelText}>Back to analysis</Text></Pressable>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  lab: { backgroundColor: colors.surface, borderRadius: radius.xl, marginTop: spacing.xl, padding: spacing.lg, ...shadow.card },
  headingLine: { alignItems: 'center', flexDirection: 'row' }, iconWell: { alignItems: 'center', backgroundColor: colors.amberGlow, borderRadius: radius.md, height: 44, justifyContent: 'center', width: 44 }, headingCopy: { flex: 1, marginLeft: spacing.md },
  eyebrow: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1 }, title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 20, letterSpacing: -0.3, marginTop: 2 }, previewPill: { alignItems: 'center', backgroundColor: colors.whiteSoft, borderRadius: radius.pill, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6 }, previewDot: { backgroundColor: colors.green, borderRadius: 4, height: 7, width: 7 }, previewText: { color: colors.textMuted, fontFamily: font.sansMedium, fontSize: 11 },
  intro: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, lineHeight: 20, marginTop: spacing.md }, sideSwitch: { backgroundColor: colors.canvas, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, padding: spacing.xs }, sideButton: { alignItems: 'center', borderRadius: radius.pill, flex: 1, justifyContent: 'center', minHeight: 44 }, buyActive: { backgroundColor: colors.greenSoft }, sellActive: { backgroundColor: colors.redSoft }, sideText: { color: colors.textMuted, fontFamily: font.sansSemiBold, fontSize: 14 }, sideTextActive: { color: colors.text },
  referenceCard: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg, padding: spacing.md }, referenceHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, referenceTitle: { color: colors.text, flex: 1, fontFamily: font.sansSemiBold, fontSize: 12 }, sourcePill: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 }, sourcePillPreview: { backgroundColor: colors.amberSoft }, sourceText: { color: colors.textMuted, fontFamily: font.monoMedium, fontSize: 8, letterSpacing: 0.6 }, referenceValues: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }, referenceLabel: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 10 }, referenceValue: { color: colors.text, fontFamily: font.monoMedium, fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 3 }, referenceFoot: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 9, lineHeight: 14, marginTop: spacing.md },
  label: { color: colors.textMuted, fontFamily: font.sansMedium, fontSize: 12, marginBottom: spacing.sm, marginTop: spacing.lg }, amountField: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', minHeight: 60, paddingHorizontal: spacing.lg }, amountFieldError: { borderColor: colors.red }, currency: { color: colors.textMuted, fontFamily: font.monoMedium, fontSize: 21 }, input: { color: colors.text, flex: 1, fontFamily: font.monoMedium, fontSize: 24, fontVariant: ['tabular-nums'], marginHorizontal: spacing.sm, minHeight: 56 }, currencyCode: { color: colors.textSubtle, fontFamily: font.monoMedium, fontSize: 11 },
  presets: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }, preset: { alignItems: 'center', backgroundColor: colors.elevated, borderRadius: radius.sm, flex: 1, justifyContent: 'center', minHeight: 40 }, presetText: { color: colors.textMuted, fontFamily: font.monoMedium, fontSize: 11 }, inlineError: { alignItems: 'center', backgroundColor: colors.redSoft, borderRadius: radius.sm, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md }, inlineErrorText: { color: colors.text, flex: 1, fontFamily: font.sans, fontSize: 12, lineHeight: 18 },
  analyzeButton: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg, minHeight: 52 }, analyzeText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 14 }, pressed: { opacity: 0.92, transform: [{ scale: 0.97 }] }, disabled: { opacity: 0.65 },
  result: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: spacing.xl, paddingTop: spacing.xl }, scoreLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, resultLabel: { color: colors.textSubtle, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 0.8 }, score: { color: colors.text, fontFamily: font.monoMedium, fontSize: 32, fontVariant: ['tabular-nums'], marginTop: spacing.xs }, scoreOutOf: { color: colors.textSubtle, fontSize: 14 }, qualityPill: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, qualityPillRisk: { backgroundColor: colors.redSoft }, qualityText: { color: colors.green, fontFamily: font.sansSemiBold, fontSize: 12 }, qualityTextRisk: { color: colors.red },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }, metric: { backgroundColor: colors.canvas, borderRadius: radius.md, minWidth: '47%', padding: spacing.md }, metricLabel: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11 }, metricValue: { color: colors.text, fontFamily: font.monoMedium, fontSize: 15, fontVariant: ['tabular-nums'], marginTop: spacing.xs }, liquidityLine: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }, liquidityCopy: { color: colors.textMuted, flex: 1, fontFamily: font.sans, fontSize: 12, lineHeight: 18 }, liquidityStrong: { color: colors.text, fontFamily: font.sansSemiBold }, warning: { alignItems: 'flex-start', backgroundColor: colors.amberSoft, borderRadius: radius.sm, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md }, warningText: { color: colors.text, flex: 1, fontFamily: font.sans, fontSize: 12, lineHeight: 18 },
  feeCard: { backgroundColor: colors.elevated, borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg, padding: spacing.md }, feeHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, feePill: { backgroundColor: colors.amberSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 }, feePillText: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 8, letterSpacing: 0.5 }, feeRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: spacing.md }, feeDisclosure: { color: colors.textMuted, fontFamily: font.sans, fontSize: 10, lineHeight: 16, marginTop: spacing.md },
  aiCard: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg, padding: spacing.md }, aiHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, aiTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 13 }, aiCopy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12, lineHeight: 19, marginTop: spacing.sm }, aiEvidence: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 10, marginTop: spacing.md }, previewButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radius.pill, justifyContent: 'center', marginTop: spacing.lg, minHeight: 50 }, previewButtonText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 14 },
  venueCard: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg, padding: spacing.md }, venueDisclosure: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 10, lineHeight: 15, marginTop: spacing.sm }, venueRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', marginTop: spacing.md, minHeight: 40, paddingTop: spacing.sm }, venueNameLine: { flex: 1 }, venueName: { color: colors.text, fontFamily: font.sansMedium, fontSize: 12 }, venueMode: { color: colors.textSubtle, fontFamily: font.monoMedium, fontSize: 8, marginTop: 2 }, venueModeLive: { color: colors.green }, venueMetric: { color: colors.text, fontFamily: font.monoMedium, fontSize: 12, fontVariant: ['tabular-nums'], marginRight: spacing.md }, bestPill: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 4 }, bestText: { color: colors.green, fontFamily: font.monoMedium, fontSize: 8 }, bestSpacer: { width: 35 }, receiptButton: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 48 }, receiptButtonSaved: { backgroundColor: colors.greenSoft, borderColor: colors.green }, receiptButtonText: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 12 }, receiptButtonTextSaved: { color: colors.green }, receiptId: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 9, marginTop: spacing.sm, textAlign: 'center' },
  viewReceiptsButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 }, viewReceiptsText: { color: colors.blue, fontFamily: font.sansSemiBold, fontSize: 12 },
  orderPreview: { backgroundColor: colors.elevated, borderRadius: radius.md, marginTop: spacing.lg, padding: spacing.lg }, orderPreviewHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, orderPreviewEyebrow: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1 }, orderRow: { alignItems: 'flex-start', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: spacing.md }, orderKey: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 12 }, orderValue: { color: colors.text, flex: 1, fontFamily: font.monoMedium, fontSize: 12, textAlign: 'right' }, orderNotice: { color: colors.textMuted, fontFamily: font.sans, fontSize: 11, lineHeight: 17, marginTop: spacing.md }, walletButton: { alignItems: 'center', backgroundColor: colors.borderStrong, borderRadius: radius.pill, justifyContent: 'center', marginTop: spacing.lg, minHeight: 48, opacity: 0.6 }, walletButtonText: { color: colors.textMuted, fontFamily: font.sansSemiBold, fontSize: 13 }, cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 }, cancelText: { color: colors.textMuted, fontFamily: font.sansMedium, fontSize: 12 },
  networkPill: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 }, networkPillMainnet: { backgroundColor: colors.redSoft }, networkPillText: { color: colors.text, fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.6 },
  walletButtonActive: { alignItems: 'center', backgroundColor: colors.text, flexDirection: 'row', gap: spacing.sm, opacity: 1 }, walletButtonActiveText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 13 },
  executedCard: { alignItems: 'flex-start', backgroundColor: colors.greenSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md }, executedCopy: { flex: 1 }, executedTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 12 }, executedSignature: { color: colors.textMuted, fontFamily: font.mono, fontSize: 10, marginTop: spacing.xs }, explorerLink: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: spacing.sm }, explorerLinkText: { color: colors.blue, fontFamily: font.sansSemiBold, fontSize: 12 },
});
