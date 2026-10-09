import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthToken } from '@solana-mobile/mobile-wallet-adapter-protocol';
import {
  connectWallet,
  signWalletMessage,
  disconnectWallet,
  getSolanaNetwork,
  reauthorizeWallet,
  signAndSendTransaction as signAndSendTransactionMwa,
  WalletConnectionCancelledError,
  WalletNotFoundError,
  type ExecutionNetwork,
  type WalletAccount,
} from '@/services/wallet/mwa';

import { authenticateApiWallet, revokeApiSession, setApiSession, type ApiSession } from '@/services/api';
import type { TradeIntent } from '@/services/wallet/transaction-guard';

const STORAGE_KEY = 'searix-trade.wallet-session';

type StoredSession = { authToken: AuthToken; account: WalletAccount; apiSession: ApiSession };

export type WalletStatus = 'restoring' | 'disconnected' | 'connecting' | 'connected';

type WalletContextValue = {
  status: WalletStatus;
  account: WalletAccount | null;
  error: string | null;
  network: ExecutionNetwork;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transactionBase64: string, expected: TradeIntent) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

async function persistSession(session: StoredSession | null) {
  if (session) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('restoring');
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [authToken, setAuthToken] = useState<AuthToken | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
      if (!raw) {
        setStatus('disconnected');
        return;
      }
      try {
        const stored = JSON.parse(raw) as StoredSession;
        const result = await reauthorizeWallet(stored.authToken);
        if (!stored.apiSession || stored.apiSession.expiresAt <= Date.now() || stored.apiSession.walletAddress !== result.account.address) throw new Error('Please reconnect your wallet.');
        setApiSession(stored.apiSession);
        setAuthToken(result.authToken);
        setAccount(result.account);
        await persistSession({ ...result, apiSession: stored.apiSession });
        setStatus('connected');
      } catch {
        await persistSession(null);
        setStatus('disconnected');
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    try {
      const result = await connectWallet();
      const apiSession = await authenticateApiWallet(result.account.address, message => signWalletMessage(message, result.authToken, result.account.address));
      setAuthToken(result.authToken);
      setAccount(result.account);
      await persistSession({ ...result, apiSession });
      setStatus('connected');
    } catch (err) {
      setApiSession(null); setAccount(null); setAuthToken(null);
      await persistSession(null);
      setStatus('disconnected');
      if (err instanceof WalletNotFoundError) {
        setError('No Solana wallet app found. Install Phantom, Solflare, or Jupiter Mobile and try again.');
      } else if (err instanceof WalletConnectionCancelledError) {
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Could not connect to your wallet.');
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    await revokeApiSession().catch(() => undefined);
    if (authToken) {
      await disconnectWallet(authToken).catch(() => undefined);
    }
    setAuthToken(null);
    setAccount(null);
    setError(null);
    await persistSession(null);
    setStatus('disconnected');
  }, [authToken]);

  const signAndSendTransaction = useCallback(
    async (transactionBase64: string, expected: TradeIntent) => {
      if (!authToken) throw new Error('Connect your wallet first.');
      return signAndSendTransactionMwa(transactionBase64, authToken, expected);
    },
    [authToken]
  );

  const value = useMemo(
    () => ({ status, account, error, network: getSolanaNetwork(), connect, disconnect, signAndSendTransaction }),
    [status, account, error, connect, disconnect, signAndSendTransaction]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
}
