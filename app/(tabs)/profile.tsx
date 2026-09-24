import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, ExternalLink, LogOut, Receipt, ShieldCheck, WalletCards } from 'lucide-react-native';
import { useWallet } from '@/context/WalletProvider';
import { usePlatformInfo } from '@/hooks/useMarkets';
import { colors, font, radius, spacing } from '@/theme';
import { formatAddress, formatCompactUsd } from '@/utils/format';

export default function Profile() {
  const { status, account, error, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const { fees, revenue } = usePlatformInfo();

  const copyAddress = async () => {
    if (!account) return;
    await Clipboard.setStringAsync(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>WALLET</Text>
        <Text style={styles.title}>Your wallet</Text>

        {status === 'connected' && account ? (
          <View style={styles.card}>
            <View style={styles.addressRow}>
              <View style={styles.avatar}>
                <WalletCards color={colors.amber} size={20} />
              </View>
              <View style={styles.addressText}>
                <Text style={styles.address}>{formatAddress(account.address)}</Text>
                {account.label ? <Text style={styles.label}>{account.label}</Text> : null}
              </View>
            </View>
            <View style={styles.actionsRow}>
              <Pressable accessibilityLabel="Copy wallet address" onPress={copyAddress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                {copied ? <Check color={colors.green} size={16} /> : <Copy color={colors.text} size={16} />}
                <Text style={styles.secondaryText}>{copied ? 'Copied' : 'Copy address'}</Text>
              </Pressable>
              <Pressable accessibilityLabel="View wallet on Solscan" onPress={() => Linking.openURL(`https://solscan.io/account/${account.address}`)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <ExternalLink color={colors.text} size={16} />
                <Text style={styles.secondaryText}>View on Solscan</Text>
              </Pressable>
            </View>
            <Pressable accessibilityLabel="Disconnect wallet" onPress={disconnect} style={({ pressed }) => [styles.disconnectButton, pressed && styles.pressed]}>
              <LogOut color={colors.red} size={16} />
              <Text style={styles.disconnectText}>Disconnect</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.icon}>
              <WalletCards color={colors.amber} size={25} />
            </View>
            <Text style={styles.cardTitle}>No wallet connected</Text>
            <Text style={styles.cardCopy}>
              Connect any Mobile Wallet Adapter app — Phantom, Solflare, Jupiter Mobile, and others — to see your address here.
            </Text>
            {status === 'connecting' ? (
              <View style={styles.connecting}>
                <ActivityIndicator color={colors.amber} />
                <Text style={styles.connectingText}>Approve the connection in your wallet app</Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={status === 'restoring'}
                onPress={connect}
                style={({ pressed }) => [styles.connectButton, pressed && styles.pressed, status === 'restoring' && styles.disabled]}
              >
                <Text style={styles.connectText}>{status === 'restoring' ? 'Checking for a session…' : 'Connect wallet'}</Text>
              </Pressable>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.trustLine}>
              <ShieldCheck color={colors.textSubtle} size={14} />
              <Text style={styles.trustText}>Searix Trade never sees or stores your private keys.</Text>
            </View>
          </View>
        )}

        <Text style={[styles.eyebrow, styles.platformEyebrow]}>PLATFORM</Text>
        <Text style={styles.platformTitle}>Fees & transparency</Text>
        <View style={styles.card}>
          {fees.data ? (
            <>
              <View style={styles.platformRow}>
                <Text style={styles.platformLabel}>Standard fee</Text>
                <Text style={styles.platformValue}>{fees.data.standardFeeBps} bps</Text>
              </View>
              <View style={styles.platformRow}>
                <Text style={styles.platformLabel}>Collection</Text>
                <View style={[styles.statusPill, fees.data.collectionEnabled ? styles.statusPillOn : styles.statusPillOff]}>
                  <Text style={[styles.statusPillText, { color: fees.data.collectionEnabled ? colors.green : colors.textMuted }]}>
                    {fees.data.collectionEnabled ? 'ENABLED' : 'PREVIEW · NOT COLLECTED'}
                  </Text>
                </View>
              </View>
              {revenue.data ? (
                <>
                  <View style={styles.platformDivider} />
                  <View style={styles.platformRow}>
                    <View style={styles.platformIconLine}><Receipt color={colors.textSubtle} size={14} /><Text style={styles.platformLabel}>Saved analyses</Text></View>
                    <Text style={styles.platformValue}>{revenue.data.receiptCount}</Text>
                  </View>
                  <View style={styles.platformRow}>
                    <Text style={styles.platformLabel}>Projected revenue</Text>
                    <Text style={styles.platformValue}>{formatCompactUsd(revenue.data.projectedRevenueUsd)}</Text>
                  </View>
                </>
              ) : null}
              <Text style={styles.platformFoot}>
                {fees.data.collectionEnabled
                  ? 'Fees are collected only when a wallet-signed trade succeeds.'
                  : 'Order execution is real and verified on-chain — this only reflects that Searix’s own fee isn’t switched on yet, so no fee is currently collected.'}
              </Text>
            </>
          ) : (
            <Text style={styles.platformFoot}>{fees.error ?? 'Loading platform info…'}</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  content: { padding: spacing.lg },
  eyebrow: { color: colors.textMuted, fontFamily: font.monoMedium, fontSize: 11, letterSpacing: 1.1, marginTop: spacing.md },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 28, letterSpacing: -0.5, marginBottom: spacing.xl, marginTop: spacing.xs },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl },
  icon: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: radius.pill, height: 56, justifyContent: 'center', marginBottom: spacing.lg, width: 56 },
  cardTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 18 },
  cardCopy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, maxWidth: 300, textAlign: 'center' },
  connectButton: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.xl, minHeight: 48, paddingHorizontal: spacing.xl, width: '100%' },
  connectText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 15 },
  disabled: { opacity: 0.6 },
  connecting: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  connectingText: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13 },
  error: { color: colors.red, fontFamily: font.sans, fontSize: 12, lineHeight: 18, marginTop: spacing.md, textAlign: 'center' },
  trustLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  trustText: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11 },
  addressRow: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.md },
  avatar: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  addressText: {},
  address: { color: colors.text, fontFamily: font.monoMedium, fontSize: 18, letterSpacing: -0.5 },
  label: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, width: '100%' },
  secondaryButton: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', minHeight: 46, paddingHorizontal: spacing.sm },
  secondaryText: { color: colors.text, fontFamily: font.sansMedium, fontSize: 13 },
  disconnectButton: { alignItems: 'center', borderColor: colors.redSoft, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', marginTop: spacing.sm, minHeight: 46, paddingHorizontal: spacing.lg, width: '100%' },
  disconnectText: { color: colors.red, fontFamily: font.sansMedium, fontSize: 14 },
  pressed: { opacity: 0.86, transform: [{ translateY: 1 }] },
  platformEyebrow: { marginTop: spacing.xxl },
  platformTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 20, marginBottom: spacing.lg, marginTop: spacing.xs },
  platformRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  platformIconLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  platformLabel: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13 },
  platformValue: { color: colors.text, fontFamily: font.monoMedium, fontSize: 14 },
  platformDivider: { backgroundColor: colors.border, height: 1, marginVertical: spacing.xs },
  platformFoot: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, lineHeight: 16, marginTop: spacing.md },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillOn: { backgroundColor: colors.greenSoft },
  statusPillOff: { backgroundColor: colors.elevated },
  statusPillText: { fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.4 },
});
