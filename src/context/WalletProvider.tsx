import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthToken } from '@solana-mobile/mobile-wallet-adapter-protocol';
import {
  connectWallet,
  disconnectWallet,
  getSolanaNetwork,
  reauthorizeWallet,
  signAndSendTransaction as signAndSendTransactionMwa,
  WalletConnectionCancelledError,
  WalletNotFoundError,
  type ExecutionNetwork,
  type WalletAccount,
} from '@/services/wallet/mwa';

const STORAGE_KEY = 'searix-trade.wallet-session';

type StoredSession = { authToken: AuthToken; account: WalletAccount };

export type WalletStatus = 'restoring' | 'disconnected' | 'connecting' | 'connected';

type WalletContextValue = {
  status: WalletStatus;
  account: WalletAccount | null;
  error: string | null;
  network: ExecutionNetwork;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transactionBase64: string) => Promise<string>;
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
        setAuthToken(result.authToken);
        setAccount(result.account);
        await persistSession(result);
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
      setAuthToken(result.authToken);
      setAccount(result.account);
      await persistSession(result);
      setStatus('connected');
    } catch (err) {
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
    async (transactionBase64: string) => {
      if (!authToken) throw new Error('Connect your wallet first.');
      return signAndSendTransactionMwa(transactionBase64, authToken);
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
